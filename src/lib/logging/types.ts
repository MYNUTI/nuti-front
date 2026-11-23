/**
 * 로깅 API의 요청 DTO(서버 필드 그대로)와 화면 입력. 응답은 이벤트 묶음 말고 모두 본문 없는 200이다.
 * 기준: 배포 Swagger(2026-11-21)와 백엔드 `main` `1ddb9b4`의 `logging/dto/*LogRequest`, `EventBatchRequest`·
 * `EventNames`. 허용값이 정해진 필드는 서버가 검사해 다르면 400이다. v3에서 노출(`/logging/impression`)과
 * 온보딩 단계(`/logging/onboarding-step`)는 없어졌다
 */

export type ScanEventResult =
  "SCAN_FAIL" | "NOT_IN_DATA" | "CHECKSUM_FAIL" | "PERMISSION_DENIED";

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

/** `POST /logging/scan-event` */
export type ScanEventLogDto = {
  result: ScanEventResult;
  /** NOT_IN_DATA·CHECKSUM_FAIL일 때만 남는다 */
  barcode?: string;
  /** 20자까지 남는다 */
  surface?: string;
};

/**
 * 앱 이벤트 이름(v3 이벤트 목록 61개, 백엔드 `EventNames.KNOWN`). 목록에 없는 이름은 서버가 오류 없이 버린다.
 * 이름마다 붙일 속성·기록 시점의 정본은 v3 기능명세 LOG_002다
 */
export type AppEventName =
  // 첫 방문 · 온보딩
  | "first_visit"
  | "app_return_open"
  | "splash_shown"
  | "onboarding_start"
  | "onboarding_step"
  | "goal_set"
  | "onboarding_complete"
  | "onboarding_abandon"
  | "permission_denied"
  | "onboarding_fallback"
  // 스캔
  | "scan_path"
  | "scan_complete"
  | "aha_second_scan"
  | "session_scan_count"
  | "scan_context"
  | "barcode_candidate_answer"
  | "barcode_multi_pick"
  | "scan_recognize_fail"
  | "scan_not_found"
  | "scan_checksum_fail"
  // 결과
  | "result_view"
  | "goal_preview_tap"
  | "grade_criteria_view"
  | "result_share"
  | "purchase_link_tap"
  // 검색 · 랭킹
  | "search_use"
  | "search_autocomplete_tap"
  | "search_result_tap"
  | "search_zero_result"
  | "zero_result_next_action"
  | "ranking_view"
  | "filter"
  // 비교 · 대안
  | "compare_add"
  | "compare_bar_view"
  | "compare_view"
  | "compare_tray_expired"
  | "alternative_tap"
  // 저장 · 기록
  | "product_save"
  | "saved_list_view"
  | "saved_product_tap"
  | "history_view"
  | "summary_view"
  // PWA
  | "pwa_prompt_view"
  | "pwa_prompt_action"
  // 기여
  | "contribute_submit"
  | "contribute_complete"
  | "contribute_abandon"
  | "contribution_list_view"
  | "report_submit"
  // 계정 · 동의
  | "login_complete"
  | "signup_consent"
  | "record_merge"
  | "consent_change"
  | "logout"
  | "account_delete"
  | "device_id_copy"
  | "notification_open"
  // 몸 정보
  | "body_profile_consent"
  | "body_profile_set"
  | "body_profile_clear"
  // 세션
  | "session_end";

/**
 * `POST /events`의 이벤트 하나. `sessionId`를 빼면 서버가 `X-Session-Id` 헤더 값을 쓴다. `occurredAt`이 없거나
 * 틀리면 받은 시각이 된다. `props`는 4KB까지이고 몸 정보 키(height·weight·age·gender·birthYear·dailyKcal 등)는
 * 서버가 지운다
 */
export type AppEventDto = {
  name: AppEventName;
  sessionId?: string;
  /** 화면 코드(예: 「3-2」). 50자까지 남는다 */
  screen?: string;
  occurredAt?: string;
  props?: Record<string, unknown>;
};

/** `POST /events` 요청. 한 번에 100개까지(넘으면 400) */
export type EventBatchDto = { events: AppEventDto[] };

/** `POST /events` 응답 */
export type EventBatchResultDto = { accepted: number; dropped: number };

// ── 화면 입력 ────────────────────────────────────────────────────────────────

/** 바코드는 인식된 경우(NOT_IN_DATA·CHECKSUM_FAIL)에만 서버가 남겨, 그때만 받는다 */
export type ScanEventInput =
  | {
      result: "NOT_IN_DATA" | "CHECKSUM_FAIL";
      barcode: string;
      surface?: string;
    }
  | { result: "SCAN_FAIL" | "PERMISSION_DENIED"; surface?: string };
