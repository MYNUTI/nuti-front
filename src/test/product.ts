import type { Goal } from "@/lib/goal/types";
import type {
  GoalResultDto,
  ProductCardDto,
  ProductResultDto,
} from "@/lib/product/types";

/** 서버 `GoalResult` 한 목표. 테스트마다 필요한 값만 덮어쓴다 */
export function goalResultDto(
  goal: Goal,
  overrides: Partial<GoalResultDto> = {},
): GoalResultDto {
  return {
    goal,
    goalLabel: goal === "WEIGHT_LOSS" ? "체중 감량" : "근육 증가",
    score: 88,
    grade: "B",
    label: "맞는 편",
    summary: "당이 조금 높아요",
    goods: [],
    bads: [],
    badsEmptyText: null,
    better: { status: "TOP", count: 0 },
    ...overrides,
  };
}

/** 서버 `ProductResultResponse`. 기본은 두 목표 점수가 있는 분석 완료 제품이다 */
export function productResultDto(
  overrides: Partial<ProductResultDto> = {},
): ProductResultDto {
  return {
    productId: 7,
    name: "두유",
    brandLine: "정식품",
    imageUrl: null,
    state: "ANALYZED",
    stateLabel: "분석 완료",
    category: null,
    patientFoodNote: null,
    serving: null,
    basis: "100mL",
    kcalBand: 2000,
    gradeVersion: "v1",
    goals: [goalResultDto("WEIGHT_LOSS"), goalResultDto("MUSCLE_GAIN")],
    nutrients: [],
    purchase: { matchType: "NONE", isAd: false },
    saved: false,
    sourceNote: null,
    ...overrides,
  };
}

/** 서버 `ProductCard`. 기본은 두 목표 점수가 있는 카드다 */
export function productCardDto(
  overrides: Partial<ProductCardDto> = {},
): ProductCardDto {
  return {
    productId: 7,
    name: "두유",
    brandLine: "정식품",
    imageUrl: null,
    state: "ANALYZED",
    stateLabel: "분석 완료",
    goals: [
      { goal: "WEIGHT_LOSS", score: 88, grade: "B", label: "맞는 편" },
      { goal: "MUSCLE_GAIN", score: 40, grade: "D", label: "안 맞는 편" },
    ],
    tags: ["단백질 많음", "당류 많음"],
    saved: false,
    ...overrides,
  };
}
