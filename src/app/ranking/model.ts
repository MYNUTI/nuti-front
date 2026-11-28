/*
 * 2-2 점수 순위 · 2-5 필터의 화면 모델. 순위 제품 · 분류 · 개수는 랭킹 API(`@/lib/ranking`)의 화면 모델을 그대로 쓰고,
 * 필터는 화면이 주소와 시트에서 늘 세 탭을 다 다루도록 빈 배열을 채운 모양으로 둔다.
 */
import type {
  NutrientFilter,
  RankingSort as ApiRankingSort,
  Seller,
} from "@/lib/ranking/types";

export type {
  NutrientFilter,
  RankedProduct,
  RankingChip,
  RankingCoverage,
  RankingGoal,
  RankingMajor,
  Seller,
} from "@/lib/ranking/types";

/** `POPULAR`는 서버에 있지만 인기 자료가 생길 때까지 정렬 시트에서 숨긴다 */
export type RankingSort = Exclude<ApiRankingSort, "POPULAR">;

/** 필터. 탭끼리는 AND, 탭 안 값끼리는 OR */
export type RankingFilters = {
  sellers: Seller[];
  /** 브랜드 줄 이름 그대로(「제조 ○○」 포함) */
  brands: string[];
  nutrients: NutrientFilter[];
};

export const NO_FILTERS: RankingFilters = {
  sellers: [],
  brands: [],
  nutrients: [],
};

/**
 * 백엔드 `FilterChip`의 라벨 · 기준 글(필터 시트 `nutrients[].label` · `rule`). 칩 순서와 기준 글을 서버 응답 없이
 * 그릴 때(필터 칩 줄 · 첫 화면 필터 시트) 쓴다
 */
export const NUTRIENT_CHIPS: {
  code: NutrientFilter;
  label: string;
  rule: string;
}[] = [
  { code: "LOW_SUGAR", label: "저당", rule: "당류 5g(음료 2.5g) 미만" },
  { code: "ZERO_SUGAR", label: "제로 슈거", rule: "당류 0.5g 미만" },
  { code: "LOW_CALORIE", label: "저칼로리", rule: "40kcal(음료 20kcal) 미만" },
  {
    code: "ZERO_CALORIE",
    label: "제로 칼로리",
    rule: "음료 100mL당 4kcal 미만",
  },
  {
    code: "HIGH_PROTEIN",
    label: "고단백",
    rule: "단백질 11g(음료 5.5g) 이상, 또는 100kcal당 5.5g 이상",
  },
  { code: "LOW_FAT", label: "저지방", rule: "지방 3g(음료 1.5g) 미만" },
];

/** 대분류 코드(2자리)인지, 칩 코드인지 분류 목록에서 찾는다 */
export function findMajor<T extends { code: string }>(
  majors: readonly T[],
  code: string,
): T | null {
  return majors.find((m) => m.code === code) ?? null;
}

export function majorOf<T extends { chips: { code: string }[] }>(
  majors: readonly T[],
  chipCode: string,
): T | null {
  return majors.find((m) => m.chips.some((c) => c.code === chipCode)) ?? null;
}
