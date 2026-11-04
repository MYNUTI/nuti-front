/**
 * 로깅 API의 요청 DTO(서버 필드 그대로)와 화면 입력. 응답은 모두 본문 없는 200이다.
 * 기준: 백엔드 커밋 c164ec0의 `logging/dto/*LogRequest`. 허용값이 정해진 필드는 서버가 검사해 다르면 400이다.
 */

export type ScanEventResult =
  "SCAN_FAIL" | "NOT_IN_DATA" | "CHECKSUM_FAIL" | "PERMISSION_DENIED";

export type OnboardingStep =
  | "CONSENT"
  | "CAMERA"
  | "START"
  | "PICKER"
  | "SCAN"
  | "FIRST_RESULT"
  | "GOAL"
  | "DONE";

export type OnboardingAction = "VIEW" | "ACCEPT" | "SKIP";

/** 샘플 픽커에 들어온 이유 */
export type PickerReason =
  "NO_ITEM" | "SCAN_FAIL" | "NOT_IN_DATA" | "PERMISSION_DENIED" | "PC";

/** 서버 주석에 적힌 노출 위치. 서버는 값을 검사하지 않는다 */
export type ImpressionSurface = "LIST" | "RECOMMENDATION" | "SEARCH";

// ── DTO ──────────────────────────────────────────────────────────────────────

/** `POST /logging/view`·`/logging/cta` */
export type ProductLogDto = { productId: number };

/** `POST /logging/search` */
export type SearchLogDto = { keyword: string; resultCount: number };

/** `POST /logging/filter` */
export type FilterLogDto = {
  /** 서버 주석의 예: category·brand·sort·grade_sort */
  filterType: string;
  filterValue?: string;
};

/** `POST /logging/impression`. 세션 안에서 같은 상품·surface는 서버가 한 번만 남긴다(position은 보지 않는다) */
export type ImpressionLogDto = {
  surface: ImpressionSurface;
  /** surface가 SEARCH일 때만 */
  keyword?: string;
  items: { productId: number; position: number }[];
};

/** `POST /logging/scan-event` */
export type ScanEventLogDto = {
  result: ScanEventResult;
  /** NOT_IN_DATA·CHECKSUM_FAIL일 때만 남는다 */
  barcode?: string;
  /** 20자까지 남는다 */
  surface?: string;
};

/** `POST /logging/onboarding-step` */
export type OnboardingStepLogDto = {
  step: OnboardingStep;
  action: OnboardingAction;
  reason?: PickerReason;
};

// ── 화면 입력 ────────────────────────────────────────────────────────────────

type ImpressionItem = {
  /** 상세 경로와 같은 문자열 ID */
  productId: string;
  position: number;
};

/** 검색 결과 노출만 검색어를 함께 보낸다 */
export type ImpressionInput =
  | { surface: "SEARCH"; keyword: string; items: ImpressionItem[] }
  | { surface: "LIST" | "RECOMMENDATION"; items: ImpressionItem[] };

/** 바코드는 인식된 경우(NOT_IN_DATA·CHECKSUM_FAIL)에만 서버가 남겨, 그때만 받는다 */
export type ScanEventInput =
  | {
      result: "NOT_IN_DATA" | "CHECKSUM_FAIL";
      barcode: string;
      surface?: string;
    }
  | { result: "SCAN_FAIL" | "PERMISSION_DENIED"; surface?: string };
