/**
 * 분석 요청·오류 제보 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 배포 Swagger(2026-11-21)와 백엔드 `main` `1ddb9b4`의 `AnalysisRequestCreateRequest`·`AnalysisRequestResponse`,
 * `ReportCreateRequest`·`ReportCreateResponse`. 문의(`/support/inquiries`)는 v3에서 없어졌다.
 */

export type AnalysisRequestType = "NEW_PRODUCT" | "NUTRITION_FILL";

/** 분석 중 · 확인 중 · 완료 · 분석 못 함 */
export type AnalysisRequestStatus =
  "ANALYZING" | "REVIEWING" | "DONE" | "FAILED";

/** 다른 제품이에요 · 이름이나 사진이 달라요 · 영양정보가 달라요 · 기타 */
export type ReportType =
  "WRONG_PRODUCT" | "NAME_OR_IMAGE" | "NUTRITION" | "OTHER";

/** 확인 중 · 반영했어요 · 반영하지 않음 */
export type ReportStatus = "RECEIVED" | "DONE" | "REJECTED";

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
  /** NEW_PRODUCT 제품명 요청. 100자 이내 */
  productName?: string;
  /** 제품명 요청의 브랜드. 50자 이내 */
  brandName?: string;
  /** 제품명 요청이 어디서 왔는지(본 바코드) */
  originBarcode?: string;
  /** 제품명 요청이 어디서 왔는지(검색어) */
  originKeyword?: string;
};

/**
 * `POST /analysis-requests`. 바코드·검색어·보강 요청은 같은 대상이면 한 요청으로 모이고 요청한 기기 수
 * (`requestCount`)는 기기당 한 번만 센다. 제품명 요청은 예외로 보낼 때마다 새 요청이 된다(백엔드 `submitName`).
 * `alreadyRequested`면 먼저 요청한 기기가 있었거나 이 기기가 이미 요청한 것이라 `message`를 그대로 보인다
 */
export type AnalysisRequestDto = {
  requestId: number;
  type: AnalysisRequestType;
  requestCount: number;
  status: AnalysisRequestStatus;
  statusLabel: string;
  alreadyRequested: boolean;
  message: string;
};

/** `POST /products/{productId}/reports` 요청. 고른 항목마다 제보 하나가 된다. 연락처는 받지 않는다 */
export type ReportCreateDto = {
  reportTypes: ReportType[];
  /** 1000자 이내. OTHER를 고르면 필수 */
  content?: string;
  /** 어떤 바코드로 본 제품에서 제보했는지 */
  barcode?: string;
};

/**
 * `POST /products/{productId}/reports`. 같은 사람·제품·항목이 아직 확인 중이면 새로 만들지 않고
 * `duplicateTypes`로 알린다(전부 겹치면 `duplicate`)
 */
export type ReportCreateResultDto = {
  reportIds: number[];
  duplicateTypes: ReportType[];
  duplicate: boolean;
  status: ReportStatus;
  statusLabel: string;
  message: string;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

/** 유형과 식별값의 짝을 타입으로 묶어, 유형에 맞지 않는 식별값으로 400을 받는 요청을 만들 수 없게 한다 */
export type AnalysisRequestInput =
  | { type: "NEW_PRODUCT"; barcode: string }
  | { type: "NEW_PRODUCT"; keyword: string }
  /** 3-6 제품 요청하기. 어디서 왔는지(본 바코드·검색어)는 선택 */
  | {
      type: "NEW_PRODUCT";
      productName: string;
      brandName?: string;
      originBarcode?: string;
      originKeyword?: string;
    }
  /** 상세 경로와 같은 문자열 ID */
  | { type: "NUTRITION_FILL"; productId: string };

export type AnalysisRequest = Omit<AnalysisRequestDto, "requestId"> & {
  requestId: string;
};

/** 상세 경로와 같은 문자열 ID. 항목은 하나 이상 */
export type ReportInput = {
  productId: string;
  reportTypes: [ReportType, ...ReportType[]];
  content?: string;
  barcode?: string;
};

export type ReportCreateResult = Omit<ReportCreateResultDto, "reportIds"> & {
  reportIds: string[];
};
