import type { CameraErrorKind, LensChoice } from "@/lib/scan/types";

/** 카메라가 열렸는데도 못 읽을 때 사진 폴백 버튼을 노출하기까지의 시간. */
export const STUCK_TIMEOUT_MS = 15_000;

/** 일시적이라 폴백 대신 재시도를 안내하는 에러. */
type RetryableError = Extract<CameraErrorKind, "in-use">;

export type PhotoReason = "camera-failed" | "user-chose";
export type ManualReason = "photo-failed" | "wasm-failed" | "user-chose";

export type ScanState =
  /** 렌즈를 고르는 중. 스캐너를 아직 마운트하지 않는다. */
  | { stage: "probing"; retryable: RetryableError | null }
  | {
      stage: "camera";
      lens: LensChoice;
      /** 오래 못 읽어 사진 폴백 버튼을 노출해야 하는 상태. */
      stuck: boolean;
      retryable: RetryableError | null;
    }
  /** 이 단계에서 나가는 길은 GO_MANUAL뿐이다. 실패해도 자동 전환하지 않는다. */
  | { stage: "photo"; reason: PhotoReason; failed: boolean }
  | { stage: "manual"; reason: ManualReason };

export type ScanEvent =
  | { type: "LENS_RESOLVED"; lens: LensChoice }
  /** OverconstrainedError는 facingMode 재시도를 소진한 뒤에만 올린다. */
  | { type: "CAMERA_ERROR"; kind: CameraErrorKind }
  | { type: "STUCK_TIMEOUT" }
  | { type: "RETRY_CAMERA" }
  | { type: "GO_PHOTO" }
  /** 촬영한 사진에서 바코드를 못 찾았다. 단계는 유지하고 재촬영 경로를 연다. */
  | { type: "PHOTO_FAILED" }
  | { type: "RETRY_PHOTO" }
  | { type: "GO_MANUAL" };

export const initialState: ScanState = { stage: "probing", retryable: null };

/**
 * WASM이 죽으면 사진 폴백도 같은 WASM을 쓰므로 건너뛴다.
 * 비보안 컨텍스트는 getUserMedia만 막으므로 사진은 여전히 동작한다.
 */
function afterCameraError(kind: CameraErrorKind): ScanState {
  if (kind === "wasm-failed") return { stage: "manual", reason: "wasm-failed" };
  return { stage: "photo", reason: "camera-failed", failed: false };
}

/**
 * 폴백 흐름의 단일 판단 지점.
 *
 * **자동 전환은 카메라를 열지 못한 경우뿐이다.** 열렸는데 못 읽는 것도, 찍은 사진에서
 * 못 찾는 것도 사용자가 다시 시도하는 중일 수 있으므로 단계를 유지한 채 플래그만
 * 세우고 다음 경로는 사용자가 고르게 한다.
 */
export function reduce(state: ScanState, event: ScanEvent): ScanState {
  switch (event.type) {
    case "LENS_RESOLVED":
      if (state.stage !== "probing") return state;
      return {
        stage: "camera",
        lens: event.lens,
        stuck: false,
        retryable: null,
      };

    case "CAMERA_ERROR":
      if (state.stage !== "probing" && state.stage !== "camera") return state;
      // 다른 앱이 점유 중인 것은 일시적이다. 프로브 중이었더라도 사진 경로에
      // 영구히 묶지 않는다 — 카메라를 놓아주면 그대로 이어갈 수 있어야 한다.
      if (event.kind === "in-use") return { ...state, retryable: "in-use" };
      return afterCameraError(event.kind);

    case "STUCK_TIMEOUT":
      if (state.stage !== "camera") return state;
      return { ...state, stuck: true };

    case "RETRY_CAMERA":
      if (state.stage === "probing") return { ...state, retryable: null };
      if (state.stage === "camera")
        return { ...state, stuck: false, retryable: null };
      return state;

    case "GO_PHOTO":
      if (state.stage !== "camera") return state;
      return { stage: "photo", reason: "user-chose", failed: false };

    case "PHOTO_FAILED":
      if (state.stage !== "photo") return state;
      return { ...state, failed: true };

    case "RETRY_PHOTO":
      if (state.stage !== "photo") return state;
      return { ...state, failed: false };

    case "GO_MANUAL":
      if (state.stage === "manual") return state;
      return {
        stage: "manual",
        // 사진에서 못 찾아 넘어온 것인지, 그냥 건너뛴 것인지를 보존한다.
        reason:
          state.stage === "photo" && state.failed
            ? "photo-failed"
            : "user-chose",
      };
  }
}
