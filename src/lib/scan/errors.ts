import type { CameraErrorKind } from "@/lib/scan/types";

/** DOMException.name → 분류. 브라우저마다 옛 이름을 쓰는 경우가 있어 함께 받는다. */
const BY_NAME: Record<string, CameraErrorKind> = {
  NotAllowedError: "permission-denied",
  PermissionDeniedError: "permission-denied",
  SecurityError: "permission-denied",
  NotFoundError: "no-camera",
  DevicesNotFoundError: "no-camera",
  OverconstrainedError: "overconstrained",
  ConstraintNotSatisfiedError: "overconstrained",
  NotReadableError: "in-use",
  TrackStartError: "in-use",
};

/**
 * react-zxing 3.0.0 `lib/esm/mediaDevices.js`의 문구에 맞춘다.
 * 라이브러리가 문구를 바꾸면 여기도 바뀌어야 하므로 앞부분만 앵커링한다.
 */
const INSECURE_CONTEXT = /^Camera access requires a secure context/;
const UNSUPPORTED = /^Camera access is not supported/;

/**
 * `getUserMedia` 실패를 폴백 판단용 분류로 바꾼다.
 *
 * `name`을 `instanceof DOMException` 밖에서 본다. `OverconstrainedError`를
 * DOMException 파생으로 노출하지 않는 엔진이 있으면 분류가 통째로 `unknown`이 되고,
 * facingMode 재시도라는 **유일한 안전망**이 조용히 사라진다. 어느 엔진이 파생 관계를
 * 지키는지는 확인하지 못했으므로 형에 기대지 않는다.
 *
 * WASM 로드 실패는 여기서 분류하지 않는다 — `ensureWasmReady()`를 따로 호출해 성패를
 * 직접 아는 편이 메시지 추측보다 확실하다.
 */
export function toCameraErrorKind(error: unknown): CameraErrorKind {
  const name = (error as { name?: unknown } | null)?.name;
  if (typeof name === "string" && name in BY_NAME) return BY_NAME[name];

  if (error instanceof Error) {
    if (INSECURE_CONTEXT.test(error.message)) return "insecure-context";
    if (UNSUPPORTED.test(error.message)) return "no-camera";
  }
  return "unknown";
}
