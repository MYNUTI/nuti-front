"use client";

import { useMemo, useState } from "react";
import { useZxing } from "react-zxing";
import { createConfirmGate } from "@/lib/scan/confirm-gate";
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

/**
 * 확정한 바코드가 이만큼 안 보이다 다시 나타나면 새로 확정한다.
 *
 * 한 사이클이 보통 150–400ms라, 계속 비추는 중 프레임 한두 개를 놓치는 것과 뗐다가 다시
 * 비추는 것을 가를 수 있는 값으로 잡았다. 실기기에서 조정한다.
 */
const RELEASE_MS = 1000;

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

  const [gate] = useState(() =>
    createConfirmGate({ threshold: CONFIRM_THRESHOLD, releaseMs: RELEASE_MS }),
  );

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

  const { ref, torch } = useZxing({
    ...scannerOptions,
    constraints,
    timeBetweenDecodingAttempts: TIME_BETWEEN_ATTEMPTS,

    onDecodeResult: (barcode) => {
      const confirmed = gate.push(barcode.rawValue, performance.now());
      if (!confirmed) return;

      navigator.vibrate?.(30);
      onGtin(toGtin14(confirmed), confirmed);
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

  return { ref, torch, usingFacingModeFallback: facingModeFallback };
}
