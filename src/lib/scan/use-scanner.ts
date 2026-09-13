"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useZxing } from "react-zxing";
import { toCameraErrorKind } from "@/lib/scan/errors";
import { toGtin14 } from "@/lib/scan/gtin";
import type { CameraErrorKind, Gtin, LensChoice } from "@/lib/scan/types";
import { scannerOptions } from "@/lib/scan/wasm";

/**
 * 같은 값이 이만큼 연속으로 읽혀야 확정한다.
 *
 * 1D 바코드는 부분만 읽히거나 잘못 읽히는 프레임이 섞인다. 첫 결과를 그대로 쓰면
 * 오독이 그대로 노출된다. 실기기 측정 후 2로 낮출 수 있다.
 */
const CONFIRM_THRESHOLD = 3;

/** 디코딩 *사이의* 휴식 시간. 프레임 레이트가 아니다 — 한 사이클 = detect 소요 + 이 값. */
const TIME_BETWEEN_ATTEMPTS = 100;

const VIDEO_SIZE = { width: { ideal: 1920 }, height: { ideal: 1080 } };

type UseScannerOptions = {
  lens: LensChoice;
  onGtin: (gtin: Gtin, raw: string) => void;
  onCameraError: (kind: CameraErrorKind) => void;
};

/**
 * `useZxing`을 감싸는 유일한 훅.
 *
 * **옵션은 마운트 후 바꾸지 않는다.** `paused` / `constraints` / `formats` /
 * `timeBetweenDecodingAttempts` 등은 모두 `startDecoding`의 의존성을 타고 effect
 * cleanup을 깨워 `track.stop()`까지 간다 — 값이 바뀌면 카메라가 꺼졌다 다시 열린다.
 * 콜백 3종만 ref로 안정화되어 있어 자유롭게 바뀔 수 있다.
 *
 * 그래서 확정 후 정지도 `paused`가 아니라 콜백 게이트로 한다. 뷰파인더는 살아 있고
 * 다음 바코드를 찍으면 결과가 바로 바뀐다.
 *
 * 유일하게 의도된 재시작은 `OverconstrainedError` 폴백이다 — 렌즈 선택이 빗나간
 * 기종에서 카메라가 아예 안 열리는 것을 막는 안전망이라 재시작을 감수한다.
 */
export function useScanner({ lens, onGtin, onCameraError }: UseScannerOptions) {
  const [facingModeFallback, setFacingModeFallback] = useState(false);

  const lastValueRef = useRef<string | null>(null);
  const streakRef = useRef(0);
  /** 직전에 확정해 이미 방출한 값. 같은 상품을 들고 있는 동안 재발화를 막는다. */
  const confirmedRef = useRef<string | null>(null);

  const deviceId = facingModeFallback ? null : lens.deviceId;

  const constraints = useMemo<MediaStreamConstraints>(
    () => ({
      audio: false,
      video: deviceId
        ? { deviceId: { exact: deviceId }, ...VIDEO_SIZE }
        : { facingMode: "environment", ...VIDEO_SIZE },
    }),
    [deviceId],
  );

  /**
   * 같은 상품을 다시 방출하게 한다. 결과 시트를 닫고 같은 바코드를 한 번 더 찍으려는
   * 경우에만 필요하다 — 다른 바코드는 값이 달라 알아서 다시 발화한다.
   */
  const resume = useCallback(() => {
    lastValueRef.current = null;
    streakRef.current = 0;
    confirmedRef.current = null;
  }, []);

  const { ref, torch } = useZxing({
    ...scannerOptions,
    constraints,
    timeBetweenDecodingAttempts: TIME_BETWEEN_ATTEMPTS,

    onDecodeResult: (barcode) => {
      const raw = barcode.rawValue;

      // 이미 방출한 값이면 삼킨다. 디코딩 루프는 계속 돌기 때문에, 카메라를 끄지 않고도
      // 같은 상품이 매 프레임 재발화하는 것을 막을 수 있다. 다른 바코드가 들어오면
      // 아래 분기에서 streak이 리셋되면서 자연히 다시 확정 대상이 된다.
      if (raw === confirmedRef.current) return;

      if (raw === lastValueRef.current) {
        streakRef.current += 1;
      } else {
        lastValueRef.current = raw;
        streakRef.current = 1;
      }
      if (streakRef.current < CONFIRM_THRESHOLD) return;

      confirmedRef.current = raw;
      navigator.vibrate?.(30);
      onGtin(toGtin14(raw), raw);
    },

    onError: (error) => {
      const kind = toCameraErrorKind(error);
      // 렌즈 선택은 라벨 휴리스틱이라 빗나갈 수 있다. 한 번은 facingMode로 되물어본
      // 뒤에야 폴백으로 넘긴다 — 지금은 실패하면 카메라가 안 열린 것처럼 보인다.
      if (kind === "overconstrained" && deviceId) {
        setFacingModeFallback(true);
        return;
      }
      onCameraError(kind);
    },
  });

  return { ref, torch, resume, usingFacingModeFallback: facingModeFallback };
}
