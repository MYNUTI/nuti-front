/**
 * 상품 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 배포 Swagger(2026-11-21)와 백엔드 `main` `1ddb9b4`의 `ProductResultResponse`, `ScanResultResponse`,
 * `PurchaseLinkResponse`. 바코드 조회와 상세가 같은 결과 모양(`ProductResultResponse`)을 쓴다.
 */

import type { Goal } from "@/lib/goal/types";

/**
 * v3 전 상태 값. 저장·검색 DTO가 아직 쓴다(API v3 동기화 13-3에서 그 도메인을 고칠 때 지운다).
 * @deprecated 상품 결과는 `ProductState`를 쓴다
 */
export type ProductStatus = "ANALYZED" | "INSUFFICIENT";

export type GradeLetter = "A" | "B" | "C" | "D" | "E";

/** 점수 없음 · 분석 완료 · 생산 중단 · 재고 판매 중 · 단종 */
export type ProductState =
  | "NO_SCORE"
  | "ANALYZED"
  | "PRODUCTION_STOPPED"
  | "STOCK_REMAINING"
  | "DISCONTINUED";

/** 성분표 한 줄의 성분. 화면 순서는 서버가 준 순서다 */
export type NutrientCode =
  | "CALORIES"
  | "CARBOHYDRATE"
  | "SUGAR"
  | "DIETARY_FIBER"
  | "PROTEIN"
  | "FAT"
  | "SATURATED_FAT"
  | "TRANS_FAT"
  | "CHOLESTEROL"
  | "SODIUM";

/** 100g(음료 100mL)당 값의 단계. 적은 편 · 보통 · 많은 편 */
export type NutrientLevel = "LOW" | "MEDIUM" | "HIGH";

/** 목표에서 이 성분이 좋은지 나쁜지. 등급에 쓰는 8종에만 온다 */
export type NutrientTone = "GOOD" | "BAD" | "NEUTRAL";

/** 더 맞는 제품: 이미 A·B / 같은 중분류에 더 높은 점수 `count`개 / C~E인데 후보 없음 */
export type BetterChoiceStatus = "TOP" | "AVAILABLE" | "NONE";

/** 구매 줄 문구를 정한다. EXACT 「구매하기」, NAME_SEARCH 「이 제품을 검색해 보기」(구매하기 금지), NONE 링크 없음 */
export type PurchaseMatchType = "EXACT" | "NAME_SEARCH" | "NONE";

/** 상세 조회의 `source` query. 서버가 최근 본 제품에 들어온 경로로 남긴다 */
export type ProductViewSource =
  | "SEARCH"
  | "RANKING"
  | "HOME"
  | "HISTORY"
  | "SAVED"
  | "ALTERNATIVE"
  | "COMPARE"
  | "OTHER";

// ── DTO ──────────────────────────────────────────────────────────────────────
// `ProductResultResponse`는 null 필드도 키를 보낸다(`@JsonInclude` 없음). `PurchaseLinkResponse`는
// `@JsonInclude(NON_NULL)` 필드만 null일 때 키를 빼 선택 속성으로 둔다

export type AmountDto = {
  /** 값이 없으면 null(0과 구분) */
  value: number | null;
  /** 1일 기준치 %. 기준치가 없는 성분(트랜스지방 등)은 null */
  dvPercent: number | null;
  level: NutrientLevel | null;
  levelLabel: string | null;
};

export type NutrientRowDto = {
  nutrient: NutrientCode;
  label: string;
  unit: string;
  per100g: AmountDto;
  /** 1회 제공량 값이 없으면 null */
  perServing: AmountDto | null;
  /** 100g 값이 없음 → 화면은 「표시 없음」 */
  missing: boolean;
  /** 목표별 좋고 나쁨. 등급에 쓰는 8종만, 점수가 없으면 null */
  tones: Partial<Record<Goal, NutrientTone>> | null;
};

export type PointDto = {
  nutrient: string;
  text: string;
  missing: boolean;
  note: string | null;
};

export type BetterChoiceDto = { status: BetterChoiceStatus; count: number };

export type GoalResultDto = {
  goal: Goal;
  goalLabel: string;
  /** 0~100 */
  score: number;
  grade: GradeLetter;
  /** 잘 맞음 · 맞는 편 · 보통 · 안 맞는 편 · 안 맞음 */
  label: string;
  /** 한 줄 해석 */
  summary: string;
  goods: PointDto[];
  bads: PointDto[];
  /** 아쉬운 점이 없을 때만 「이 목표에서 아쉬운 점이 없어요」 */
  badsEmptyText: string | null;
  better: BetterChoiceDto;
};

export type PurchaseLinkDto = {
  /** 링크가 있을 때 COUPANG */
  vendor?: string;
  url?: string;
  matchType: PurchaseMatchType;
  /** EXACT이고 24시간 이내 조회분일 때만 */
  price?: number;
  priceCheckedAt?: string;
  priceStale?: boolean;
  isAd: boolean;
  /** 구매 버튼 바로 옆에 둘 광고 고지(링크가 있을 때) */
  adNotice?: string;
};

/** `GET /products/{productId}`, 바코드 조회의 `result` */
export type ProductResultDto = {
  productId: number;
  name: string;
  /** 브랜드, 없으면 「제조 ○○」 */
  brandLine: string | null;
  imageUrl: string | null;
  state: ProductState;
  stateLabel: string;
  /** 분류가 없으면 null */
  category: { code: string; name: string } | null;
  /** 마시는 환자용 균형영양식이면 「환자용 식품이에요」 */
  patientFoodNote: string | null;
  /** 1회 제공량이 없으면 null */
  serving: { text: string; amount: number; unit: string } | null;
  basis: "100g" | "100mL";
  /** 감량 점수에 쓴 하루 칼로리 구간 */
  kcalBand: number;
  /** 점수가 없으면 null */
  gradeVersion: string | null;
  /** 두 목표. 점수가 없으면 빈 배열 */
  goals: GoalResultDto[];
  nutrients: NutrientRowDto[];
  purchase: PurchaseLinkDto;
  saved: boolean;
  sourceNote: string | null;
};

export type ProductCandidateDto = {
  productId: number;
  name: string;
  brandLine: string | null;
  imageUrl: string | null;
  state: ProductState;
  stateLabel: string;
};

/** 목록 카드의 목표별 점수·등급 */
export type GoalGradeDto = {
  goal: Goal;
  /** 0~100 */
  score: number;
  grade: GradeLetter;
  label: string;
};

/** 영양소 정렬일 때만 온다. 카드 태그 한 줄을 「단백질 21g · 100g당」으로 바꾼다 */
export type SortValueDto = {
  nutrient: string;
  value: number | null;
  unit: string;
  basis: string;
  text: string;
};

/**
 * 목록 카드 한 장. 검색·랭킹·최근 본 제품·즐겨찾기·더 맞는 제품이 같은 모양을 쓴다.
 * `sortValue`·`better`는 `@JsonInclude(NON_NULL)`이라 없으면 키가 빠진다
 */
export type ProductCardDto = {
  productId: number;
  name: string;
  brandLine: string | null;
  imageUrl: string | null;
  state: ProductState;
  stateLabel: string;
  /** 두 목표의 점수·등급. 점수가 없으면 빈 배열 */
  goals: GoalGradeDto[];
  /**
   * 요청 목표 기준 「이 점수인 이유」 짧은 말 최대 두 개. 좋은 점 1 + 아쉬운 점 1을 먼저 넣고, 한쪽이
   * 없으면 다른 쪽으로 채운다(좋은 점만 2개·아쉬운 점만 2개도 온다). 좋은지 나쁜지 표시는 없다
   * (백엔드 `NutrientEvaluator.tags`)
   */
  tags: string[];
  sortValue?: SortValueDto;
  /** 최근 본 제품·즐겨찾기·결과에서만 온다 */
  better?: BetterChoiceDto;
  saved: boolean;
};

/** 후보 − 지금 제품, 100g(음료 100mL)당. 예 「칼로리 −29kcal」 */
export type AlternativeDiffDto = {
  nutrient: string;
  label: string;
  unit: string;
  diff: number;
  text: string;
};

/**
 * `GET /products/{productId}/alternatives`. 같은 중분류에서 요청 목표 점수가 더 높은 제품(분석 완료·생산 중),
 * 점수 높은 순. 지금 제품에 점수나 중분류가 없으면 `items`가 빈 배열. `page`는 0부터
 */
export type AlternativesDto = {
  current: ProductCardDto;
  goal: Goal;
  kcalBand: number;
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
  items: { product: ProductCardDto; diffs: AlternativeDiffDto[] }[];
};

/**
 * `GET /products/barcode/{barcode}`. 미등록도 200(`NOT_FOUND`)이다. 체크섬이 틀리면 400
 * `BARCODE_CHECKSUM_INVALID`. `barcode`는 서버가 13자리로 정규화한 값이다
 */
export type ScanResultDto =
  | {
      /** RESULT: 점수 있는 제품 하나. NO_SCORE: 성분 7가지 중 빠진 것이 있어 `goals`가 빈 배열 */
      outcome: "RESULT" | "NO_SCORE";
      barcode: string;
      result: ProductResultDto;
      candidates: null;
    }
  | {
      /** 바코드에 제품이 둘 이상. 고른 뒤 상세를 조회한다 */
      outcome: "MULTIPLE";
      barcode: string;
      result: null;
      candidates: ProductCandidateDto[];
    }
  | { outcome: "NOT_FOUND"; barcode: string; result: null; candidates: null };

// ── 화면 모델 ────────────────────────────────────────────────────────────────

export type Amount = AmountDto;
export type NutrientRow = NutrientRowDto;
export type Point = PointDto;
export type GoalResult = GoalResultDto;

export type PurchaseLink = {
  matchType: PurchaseMatchType;
  url: string | null;
  price: number | null;
  priceCheckedAt: string | null;
  priceStale: boolean;
  isAd: boolean;
  adNotice: string | null;
};

export type ProductResult = {
  /** 상세 경로(`/product/[id]`)가 문자열이라 문자열로 바꾼다 */
  id: string;
  name: string;
  brandLine: string | null;
  imageUrl: string | null;
  state: ProductState;
  stateLabel: string;
  category: { code: string; name: string } | null;
  patientFoodNote: string | null;
  serving: { text: string; amount: number; unit: string } | null;
  basis: "100g" | "100mL";
  kcalBand: number;
  /** 목표별 결과. 점수가 없는 제품은 null이라, 점수를 꺼내려면 null 처리를 거쳐야 한다 */
  goals: Record<Goal, GoalResult> | null;
  nutrients: NutrientRow[];
  purchase: PurchaseLink;
  saved: boolean;
  sourceNote: string | null;
};

export type ProductCandidate = Omit<ProductCandidateDto, "productId"> & {
  id: string;
};

export type GoalGrade = GoalGradeDto;
export type SortValue = SortValueDto;
export type BetterChoice = BetterChoiceDto;
export type AlternativeDiff = AlternativeDiffDto;

/** 목록 카드. UI 부품 `ProductCard`와 이름이 겹치지 않게 `Data`를 붙인다 */
export type ProductCardData = {
  id: string;
  name: string;
  brandLine: string | null;
  imageUrl: string | null;
  state: ProductState;
  stateLabel: string;
  /** 목표별 점수·등급. 점수가 없는 제품은 null */
  goals: Record<Goal, GoalGrade> | null;
  tags: string[];
  sortValue: SortValue | null;
  better: BetterChoice | null;
  saved: boolean;
};

export type Alternative = {
  product: ProductCardData;
  diffs: AlternativeDiff[];
};

/** 더 맞는 제품 한 페이지 */
export type AlternativesPage = {
  current: ProductCardData;
  goal: Goal;
  kcalBand: number;
  total: number;
  hasNext: boolean;
  items: Alternative[];
};

export type BarcodeScan =
  | { outcome: "RESULT" | "NO_SCORE"; barcode: string; product: ProductResult }
  | { outcome: "MULTIPLE"; barcode: string; candidates: ProductCandidate[] }
  | { outcome: "NOT_FOUND"; barcode: string };
