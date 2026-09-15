"use client";

import { useEffect, useReducer, useState } from "react";
import { ScanViewfinder } from "@/components/scan/scan-viewfinder";
import { toCameraErrorKind } from "@/lib/scan/errors";
import { pickMainLens } from "@/lib/scan/lens";
import {
  initialState,
  reduce,
  STUCK_TIMEOUT_MS,
  type CameraUnavailableReason,
  type ScanEvent,
  type ScanState,
} from "@/lib/scan/machine";
import type { Gtin, ScanSource } from "@/lib/scan/types";
import { useScanner } from "@/lib/scan/use-scanner";
import { ensureWasmReady } from "@/lib/scan/wasm";

export type BarcodeScanProps = {
  onGtin: (gtin: Gtin, source: ScanSource) => void;
  /**
   * 뷰파인더 아래를 호출자가 그린다. 보조 입력 버튼과 문구는 온보딩과 메인 탭이 달라서
   * 스캐너가 소유하지 않는다. 단계를 넘겨주는 이유는 WASM이 죽었을 때처럼 호출자의
   * 버튼 상태가 스캐너 상태에 따라 달라져야 하기 때문이다.
   */
  children?: (state: ScanState) => React.ReactNode;
  /** 뷰파인더 위에 겹쳐 그린다(결과 시트). 카메라 단계가 아니어도 같은 자리에 둔다. */
  overlay?: React.ReactNode;
  className?: string;
};

/**
 * 스캐너 진입점.
 *
 * GTIN만 방출한다 — 상품 조회도, 결과 시트도 모른다. 그래서 온보딩과 메인 탭이 같은
 * 스캐너를 쓰면서 성공 후 동작을 다르게 가져갈 수 있다.
 *
 * 흐름 판단은 전부 `machine.ts`에 있다. 여기서는 상태를 렌더에 매핑하기만 한다.
 */
export function BarcodeScan({
  onGtin,
  children,
  overlay,
  className,
}: BarcodeScanProps) {
  const [state, dispatch] = useReducer(reduce, initialState);
  /**
   * 재시도할 때마다 올린다. `CameraStage`의 key로 써서 **remount**를 강제한다 —
   * `useZxing`은 옵션이 바뀔 때만 스트림을 다시 여는데, 점유 에러 복구는 바뀌는 옵션이
   * 하나도 없어서 플래그만 되돌리면 화면이 검은 채로 남는다.
   */
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setAttempt((n) => n + 1);
    dispatch({ type: "RETRY_CAMERA" });
  };

  const probing = state.stage === "probing";
  // 점유 에러로 멈춰 있는 동안에는 다시 프로브하지 않는다. RETRY_CAMERA로 풀리면
  // attempt가 올라 effect가 다시 돈다.
  const blocked = state.stage === "probing" && state.retryable !== null;

  useEffect(() => {
    if (!probing || blocked) return;
    let cancelled = false;

    void (async () => {
      // WASM 성패를 카메라와 분리해서 확인한다. react-zxing은 둘을 한 try 블록으로
      // 감싸 같은 onError로 넘기기 때문에, 콜백만 봐서는 구분할 수 없다.
      try {
        await ensureWasmReady();
      } catch {
        if (!cancelled) dispatch({ type: "CAMERA_ERROR", kind: "wasm-failed" });
        return;
      }

      try {
        const lens = await pickMainLens();
        if (!cancelled) dispatch({ type: "LENS_RESOLVED", lens });
      } catch (error) {
        if (!cancelled) {
          dispatch({ type: "CAMERA_ERROR", kind: toCameraErrorKind(error) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [probing, blocked, attempt]);

  return (
    <>
      {state.stage === "camera" ? (
        <CameraStage
          key={attempt}
          state={state}
          dispatch={dispatch}
          onRetry={retry}
          onGtin={onGtin}
          overlay={overlay}
          className={className}
        />
      ) : (
        <Placeholder
          state={state}
          onRetry={retry}
          overlay={overlay}
          className={className}
        />
      )}

      {children?.(state)}
    </>
  );
}

function CameraStage({
  state,
  dispatch,
  onRetry,
  onGtin,
  overlay,
  className,
}: {
  state: Extract<ScanState, { stage: "camera" }>;
  dispatch: (event: ScanEvent) => void;
  onRetry: () => void;
  onGtin: BarcodeScanProps["onGtin"];
  overlay?: React.ReactNode;
  className?: string;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const showingResult = Boolean(overlay);

  const { ref } = useScanner({
    lens: state.lens,
    onGtin: (gtin) => {
      setConfirmed(true);
      onGtin(gtin, "camera");
    },
    onCameraError: (kind) => dispatch({ type: "CAMERA_ERROR", kind }),
  });

  useEffect(() => {
    // 결과가 이미 떠 있으면(카메라든 사진·직접 입력이든) "잘 안 잡히면" 안내는 거짓말이다.
    if (confirmed || showingResult) return;
    const timer = setTimeout(
      () => dispatch({ type: "STUCK_TIMEOUT" }),
      STUCK_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [confirmed, showingResult, dispatch]);

  return (
    <ScanViewfinder videoRef={ref} className={className}>
      {state.retryable === "in-use" ? (
        <Notice onRetry={onRetry}>다른 앱이 카메라를 쓰고 있어요</Notice>
      ) : (
        state.stuck &&
        !confirmed &&
        !showingResult && (
          <Notice>바코드가 잘 안 잡히면 다른 방법으로 입력해 주세요</Notice>
        )
      )}
      {overlay}
    </ScanViewfinder>
  );
}

/** 뷰파인더 자리 문구. 다음 행동 안내는 호출자 몫이라 원인만 말한다. */
const UNAVAILABLE_MESSAGE: Record<CameraUnavailableReason, string> = {
  "permission-denied": "카메라 권한이 허용되지 않았어요",
  "no-camera": "사용할 수 있는 카메라가 없어요",
  "insecure-context": "보안 연결(HTTPS)에서만 카메라를 쓸 수 있어요",
  overconstrained: "카메라를 열지 못했어요",
  unknown: "카메라를 열지 못했어요",
};

/** 카메라가 아닌 단계의 자리. 최소한 무슨 일이 벌어졌는지는 알려준다. */
function Placeholder({
  state,
  onRetry,
  overlay,
  className,
}: {
  state: ScanState;
  onRetry: () => void;
  overlay?: React.ReactNode;
  className?: string;
}) {
  const message =
    state.stage === "probing"
      ? state.retryable === "in-use"
        ? "다른 앱이 카메라를 쓰고 있어요"
        : "카메라를 준비하고 있어요"
      : state.stage === "photo"
        ? UNAVAILABLE_MESSAGE[state.reason]
        : "이 환경에서는 바코드를 읽을 수 없어요";

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center gap-3 rounded-3xl bg-muted px-6 text-center ${className ?? ""}`}
    >
      <p className="text-[15px] text-muted-foreground">{message}</p>
      {state.stage === "probing" && state.retryable === "in-use" && (
        <button
          type="button"
          onClick={onRetry}
          className="text-[15px] font-bold underline"
        >
          다시 시도
        </button>
      )}
      {overlay}
    </div>
  );
}

/** 뷰파인더 상단에 띄운다 — 하단은 결과 시트 자리다. */
function Notice({
  children,
  onRetry,
}: {
  children: React.ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="absolute inset-x-4 top-4 flex items-center gap-2 rounded-2xl bg-black/70 px-4 py-3 text-[13px] text-white">
      <span className="flex-1">{children}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-bold underline">
          다시 시도
        </button>
      )}
    </div>
  );
}
