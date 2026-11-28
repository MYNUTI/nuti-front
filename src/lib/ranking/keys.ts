import type {
  RankingFilters,
  RankingGoal,
  RankingSort,
} from "@/lib/ranking/types";

// 목표는 늘 보낸다. 빼면 서버가 내 목표가 아니라 감량으로 계산하고, 빠진 키와 감량 키가 같은 응답을 따로 캐시한다

export type RankingListKey = {
  category: string;
  goal: RankingGoal;
  sort?: RankingSort;
  filters?: RankingFilters;
};

export type RankingOverviewKey = {
  major: string;
  goal: RankingGoal;
  filters?: RankingFilters;
};

export type RankingLeadersKey = {
  goal: RankingGoal;
  filters?: RankingFilters;
};

function sortedUnique<T extends string>(values: T[]) {
  return [...new Set(values)].sort();
}

// 빈 필터와 필터 없음, 순서 · 중복만 다른 필터가 같은 키가 되게 한다(서버는 탭 안 값을 OR로 보고 중복을 합친다).
// 브랜드는 서버처럼 앞뒤 공백을 지우고 빈 값을 뺀다
function normalize(filters: RankingFilters = {}) {
  return {
    brands: sortedUnique(
      (filters.brands ?? []).map((b) => b.trim()).filter((b) => b !== ""),
    ),
    nutrients: sortedUnique(filters.nutrients ?? []),
    sellers: sortedUnique(filters.sellers ?? []),
  };
}

/** 점수 · 태그 · 순서가 목표 기준이라 목표마다, 필터 조합마다 따로 캐시한다 */
export const rankingKeys = {
  all: ["ranking"] as const,
  categories: () => [...rankingKeys.all, "categories"] as const,
  lists: () => [...rankingKeys.all, "list"] as const,
  list: (key: RankingListKey) =>
    [
      ...rankingKeys.lists(),
      key.category,
      key.goal,
      key.sort ?? null,
      normalize(key.filters),
    ] as const,
  overviews: () => [...rankingKeys.all, "overview"] as const,
  overview: (key: RankingOverviewKey) =>
    [
      ...rankingKeys.overviews(),
      key.major,
      key.goal,
      normalize(key.filters),
    ] as const,
  leadersAll: () => [...rankingKeys.all, "leaders"] as const,
  leaders: (key: RankingLeadersKey) =>
    [...rankingKeys.leadersAll(), key.goal, normalize(key.filters)] as const,
  filters: (category: string, filters?: RankingFilters) =>
    [...rankingKeys.all, "filters", category, normalize(filters)] as const,
  brands: (category: string, q: string) =>
    [...rankingKeys.all, "brands", category, q] as const,
};
