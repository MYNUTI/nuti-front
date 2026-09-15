import type { CameraErrorKind, LensChoice } from "@/lib/scan/types";

/** 카메라가 열렸는데도 못 읽을 때 안내 문구를 띄우기까지의 시간. */
export const STUCK_TIMEOUT_MS = 15_000;

/** 일시적이라 폴백 대신 재시도를 안내하는 에러. */
type RetryableError = Extract<CameraErrorKind, "in-use">;

/** 카메라를 못 연 원인 중 사진 디코딩은 여전히 가능한 것들. */
export type CameraUnavailableReason = Exclude<
  CameraErrorKind,
  "in-use" | "wasm-failed"
>;

export type ScanState =
  /** 렌즈를 고르는 중. 스캐너를 아직 마운트하지 않는다. */
  | { stage: "probing"; retryable: RetryableError | null }
  | {
      stage: "camera";
      lens: LensChoice;
      /** 오래 못 읽어 다른 입력 방법을 안내해야 하는 상태. */
      stuck: boolean;
      retryable: RetryableError | null;
    }
  /** 카메라를 쓸 수 없다. 앨범·사진 선택과 직접 입력은 가능하다. */
  | { stage: "photo"; reason: CameraUnavailableReason }
  /** WASM을 못 불러와 사진도 읽을 수 없다. 직접 입력만 남는다. */
  | { stage: "manual" };

export type ScanEvent =
  | { type: "LENS_RESOLVED"; lens: LensChoice }
  /** OverconstrainedError는 facingMode 재시도를 소진한 뒤에만 올린다. */
  | { type: "CAMERA_ERROR"; kind: CameraErrorKind }
  | { type: "STUCK_TIMEOUT" }
  | { type: "RETRY_CAMERA" };

export const initialState: ScanState = { stage: "probing", retryable: null };

/**
 * 뷰파인더 자리에 무엇을 둘지 판단한다.
 *
 * `[앨범에서 선택]`·`[직접 입력]`은 단계와 무관하게 상시 노출이라 여기서 모델링하지
 * 않는다 — 버튼을 누른다고 카메라를 끄지 않고, 사진에서 못 찾았다고 단계를 옮기지도
 * 않는다. 이 머신이 옮기는 것은 **카메라를 열지 못한 경우**뿐이다.
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
      // 사진 디코딩도 같은 WASM을 쓰므로 WASM이 죽으면 직접 입력만 남는다.
      if (event.kind === "wasm-failed") return { stage: "manual" };
      return { stage: "photo", reason: event.kind };

    case "STUCK_TIMEOUT":
      if (state.stage !== "camera") return state;
      return { ...state, stuck: true };

    case "RETRY_CAMERA":
      if (state.stage === "probing") return { ...state, retryable: null };
      if (state.stage === "camera")
        return { ...state, stuck: false, retryable: null };
      return state;
  }
}
