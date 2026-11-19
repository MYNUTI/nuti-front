/** GTIN-14로 정규화된 바코드 값. */
export type Gtin = string;

export type ScanSource = "camera" | "photo" | "manual";

export type LensReason =
  /** iOS에서 메인 렌즈를 뜻하는 "Back Camera" 정확일치. */
  | "exact-back-camera"
  /** 라벨에서 파싱한 번호가 가장 작은 렌즈. Android 관례상 0번이 메인이다. */
  | "lowest-index"
  /**
   * 최솟값을 공유하는 후보가 둘 이상이라 라벨로는 못 가른다.
   *
   * 첫 항목을 쓰지만 그건 `enumerateDevices()` 열거 순서이고, 그 순서는 렌즈 번호와
   * 무관하다. 초광각이 뽑혔을 수 있으므로 인식이 안 되면 여기부터 의심한다.
   */
  | "ambiguous-back"
  /** 후면 렌즈가 하나뿐이라 고를 것이 없었다. */
  | "single-back"
  /** 후면 렌즈를 찾지 못해 facingMode에 맡긴다. */
  | "fallback-facing-mode";

export type LensCandidate = {
  deviceId: string;
  label: string;
  /** 라벨에서 파싱한 렌즈 번호. **낮을수록 우선**하며, 파싱 실패 시 MAX_SAFE_INTEGER. */
  score: number;
};

export type LensChoice = {
  /** null이면 facingMode로 폴백한다. */
  deviceId: string | null;
  label: string;
  reason: LensReason;
  candidates: readonly LensCandidate[];
};

/**
 * 카메라를 열지 못한 원인.
 *
 * react-zxing의 `onError`는 `assertCameraAccess` → `prepareWasm` →
 * `getUserMedia` → `play`를 한 try 블록으로 감싸므로, DOMException뿐 아니라
 * WASM 로드 실패와 비보안 컨텍스트도 같은 콜백으로 들어온다.
 */
export type CameraErrorKind =
  /** NotAllowedError — 권한 거부, 인앱 브라우저. */
  | "permission-denied"
  /** NotFoundError — 카메라 없음. */
  | "no-camera"
  /** OverconstrainedError — deviceId exact 실패. facingMode 재시도까지 소진한 뒤에만 방출한다. */
  | "overconstrained"
  /** NotReadableError — 다른 앱이 점유 중. 폴백하지 않고 재시도를 안내한다. */
  | "in-use"
  /** isSecureContext가 false. 개발 환경 전용이며 사진 폴백은 여전히 동작한다. */
  | "insecure-context"
  /** WASM 로드 실패. 사진 폴백도 같은 WASM을 쓰므로 건너뛴다. */
  | "wasm-failed"
  | "unknown";
