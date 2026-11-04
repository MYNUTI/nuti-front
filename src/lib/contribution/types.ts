/**
 * 분석 요청·문의 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 백엔드 커밋 c164ec0의 `AnalysisRequestCreateRequest`·`AnalysisRequestResponse`,
 * `InquiryCreateRequest`·`InquiryCreateResponse`.
 */

export type AnalysisRequestType = "NEW_PRODUCT" | "NUTRITION_FILL";

export type AnalysisRequestStatus = "WAITING" | "PROCESSING" | "DONE" | "HOLD";

// ── DTO ──────────────────────────────────────────────────────────────────────

/** `POST /analysis-requests` 요청. 유형마다 식별값이 하나다(빠지면 400) */
export type AnalysisRequestCreateDto = {
  type: AnalysisRequestType;
  /** NEW_PRODUCT. 8·12·13·14자리 */
  barcode?: string;
  /** NEW_PRODUCT. 검색 0건 폴백, 30자 이내 */
  keyword?: string;
  /** NUTRITION_FILL */
  productId?: number;
};

/**
 * `POST /analysis-requests`. 같은 식별값을 다시 접수하면 `requestCount`만 오른 기존 항목이 온다.
 * 등록됐지만 영양정보가 부족한 바코드는 보강 요청으로 받아 `NEW_PRODUCT`로 보내도 `type`이 `NUTRITION_FILL`로 온다
 */
export type AnalysisRequestDto = {
  requestId: number;
  type: AnalysisRequestType;
  requestCount: number;
  status: AnalysisRequestStatus;
};

/** `POST /support/inquiries` 요청 */
export type InquiryCreateDto = {
  /** 필수, 1000자 이하 */
  content: string;
  /** 20자 이하 */
  category?: string;
  contactEmail?: string;
};

/** `POST /support/inquiries` */
export type InquiryDto = { inquiryId: number };

// ── 화면 모델 ────────────────────────────────────────────────────────────────

/** 유형과 식별값의 짝을 타입으로 묶어, 유형에 맞지 않는 식별값으로 400을 받는 요청을 만들 수 없게 한다 */
export type AnalysisRequestInput =
  | { type: "NEW_PRODUCT"; barcode: string }
  | { type: "NEW_PRODUCT"; keyword: string }
  /** 상세 경로와 같은 문자열 ID */
  | { type: "NUTRITION_FILL"; productId: string };

export type AnalysisRequest = Omit<AnalysisRequestDto, "requestId"> & {
  requestId: string;
};
