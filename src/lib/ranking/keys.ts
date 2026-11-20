import type {
  RankingFilters,
  RankingGoal,
  RankingSort,
} from "@/lib/ranking/types";

/** 응답을 어디서 받았는지. 예시 자료로 받은 값이 실제 서버 캐시와 섞이지 않게 키에 넣는다 */
export type RankingSourceId = "live" | "sample";

export type RankingListKey = {
  category: string;
  goal?: RankingGoal;
  sort?: RankingSort;
  filters?: RankingFilters;
};

export type RankingOverviewKey = {
  major: string;
  goal?: RankingGoal;
  filters?: RankingFilters;
};

// 빈 필터와 필터 없음이 같은 키가 되게 한다
function normalize(filters: RankingFilters = {}) {
  return {
    brands: filters.brands ?? [],
    nutrients: filters.nutrients ?? [],
    sellers: filters.sellers ?? [],
  };
}

export const rankingKeys = {
  all: (source: RankingSourceId) => ["ranking", source] as const,
  categories: (source: RankingSourceId) =>
    [...rankingKeys.all(source), "categories"] as const,
  lists: (source: RankingSourceId) =>
    [...rankingKeys.all(source), "list"] as const,
  list: (source: RankingSourceId, key: RankingListKey) =>
    [
      ...rankingKeys.lists(source),
      key.category,
      key.goal ?? null,
      key.sort ?? null,
      normalize(key.filters),
    ] as const,
  overviews: (source: RankingSourceId) =>
    [...rankingKeys.all(source), "overview"] as const,
  overview: (source: RankingSourceId, key: RankingOverviewKey) =>
    [
      ...rankingKeys.overviews(source),
      key.major,
      key.goal ?? null,
      normalize(key.filters),
    ] as const,
  filters: (
    source: RankingSourceId,
    category: string,
    filters?: RankingFilters,
  ) =>
    [
      ...rankingKeys.all(source),
      "filters",
      category,
      normalize(filters),
    ] as const,
  brands: (source: RankingSourceId, category: string, q: string) =>
    [...rankingKeys.all(source), "brands", category, q] as const,
};
