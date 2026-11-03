/**
 * 상품·등급 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 백엔드 커밋 c164ec0의 `BarcodeScanResponse`, `ProductDetailResponse`, `GradeReasonResponse`.
 * 상세 응답의 1차 웹 호환 필드(`id`, `name`, `pns`, `nutrients` 등)는 제거 예정이라 넣지 않는다.
 */

import type { Goal } from "@/lib/goal/types";

export type ProductStatus = "ANALYZED" | "INSUFFICIENT";

export type GradeLetter = "A" | "B" | "C" | "D" | "E";

export type NutrientCode =
  | "CALORIES"
  | "PROTEIN"
  | "DIETARY_FIBER"
  | "SUGAR"
  | "SATURATED_FAT"
  | "TRANS_FAT"
  | "CHOLESTEROL"
  | "SODIUM";

// ── DTO ──────────────────────────────────────────────────────────────────────
// 서버는 `@JsonInclude(NON_NULL)`이 붙은 필드만 null일 때 키를 뺀다. 그 필드는 선택 속성으로 두고,
// 나머지 중 서버 소스에서 null이 될 수 있는 필드는 `| null`이다

export type ProductSummaryDto = {
  productId: number;
  name: string;
  brandName: string | null;
  imageUrl: string | null;
  /** 영양정보 행이 없으면 null */
  servingSize: string | null;
  /** 출처 문구. 스캔·상세 모두 오고, 서버 DB 문구가 없으면 키가 빠진다(노션 명세는 상세에만 적음) */
  sourceNote?: string;
};

export type GradeBadgeDto = {
  /** 0~100 */
  score: number;
  grade: GradeLetter;
  /** DB 문구가 없으면 서버가 기본 문구로 채운다(`CalibrationService.label`) */
  label: string;
  /** 서버 DB 문구라 없으면 null이다 */
  badgeText: string | null;
  /** 식이섬유 값이 있었는지. 없으면 0으로 계산했다 */
  fiberIncluded: boolean;
};

/** 1회 제공량 기준 값. 판정 7종 중 빠진 값이 있으면 INSUFFICIENT라 어느 값이든 null일 수 있다 */
export type NutritionDto = {
  calories: number | null;
  protein: number | null;
  sugar: number | null;
  saturatedFat: number | null;
  transFat: number | null;
  cholesterol: number | null;
  sodium: number | null;
  dietaryFiber: number | null;
};

/** `GET /products/barcode/{barcode}` */
export type BarcodeScanDto = {
  status: ProductStatus;
  product: ProductSummaryDto;
  /** INSUFFICIENT면 없다 */
  grade?: GradeBadgeDto;
  /** INSUFFICIENT이거나 감점 요인이 없으면 없다 */
  topReason?: string;
  appliedGoal: Goal;
};

/** `GET /products/{productId}` */
export type ProductDetailDto = BarcodeScanDto & {
  /** 영양정보 행이 없으면 없다 */
  nutrition?: NutritionDto;
  /** 소유자(로그인·익명) 기준 */
  saved: boolean;
};

/** `GET /products/{productId}/grade-reason`. INSUFFICIENT 상품은 409 `GRADE_NOT_AVAILABLE` */
export type GradeReasonDto = {
  appliedGoal: Goal;
  /** 감점이 큰 순. 감점이 없으면 빈 배열 */
  factors: GradeFactorDto[];
  /** 식이섬유 값이 없어 0으로 계산했을 때만 온다 */
  fiberNotice?: string;
  methodology: { steps: string[]; note: string | null };
};

export type GradeFactorDto = {
  nutrient: NutrientCode;
  label: string;
  /** 100g 기준 */
  value: number;
  unit: string;
  /** 감점 시작 기준값 */
  threshold: number | null;
  sentence: string | null;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

export type ProductSummary = {
  /** 상세 경로(`/product/[id]`)와 스캔 결과(`ScanResult.id`)가 문자열이라 문자열로 바꾼다 */
  id: string;
  name: string;
  brandName: string | null;
  imageUrl: string | null;
  servingSize: string | null;
  sourceNote: string | null;
};

export type GradeBadge = GradeBadgeDto;

/**
 * 등급 유무를 status로 나눈다. 등급은 status를 ANALYZED로 좁혀야 꺼낼 수 있어, 등급 없음 처리를
 * 빠뜨리거나 「분석 완료인데 등급 없음」 같은 조합을 만들 수 없다.
 */
export type Grading =
  | {
      status: "ANALYZED";
      grade: GradeBadge;
      /** 감점 요인이 없으면 null */
      topReason: string | null;
    }
  | { status: "INSUFFICIENT" };

export type ScannedProduct = Grading & {
  product: ProductSummary;
  appliedGoal: Goal;
};

export type Nutrition = NutritionDto;

export type ProductDetail = ScannedProduct & {
  nutrition: Nutrition | null;
  saved: boolean;
};

export type GradeFactor = GradeFactorDto;

export type GradeReason = {
  appliedGoal: Goal;
  factors: GradeFactor[];
  fiberNotice: string | null;
  methodology: { steps: string[]; note: string | null };
};
