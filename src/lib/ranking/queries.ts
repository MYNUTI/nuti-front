import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  fetchRanking,
  fetchRankingBrands,
  fetchRankingCategories,
  fetchRankingFilters,
  fetchRankingLeaders,
  fetchRankingOverview,
} from "@/lib/ranking/api";
import {
  rankingKeys,
  type RankingLeadersKey,
  type RankingListKey,
  type RankingOverviewKey,
} from "@/lib/ranking/keys";
import { mergeRankingPages } from "@/lib/ranking/mapper";
import type { RankingFilters } from "@/lib/ranking/types";

// 디자인 메모(2-2): 목록 끝에 닿을 때마다 다음 12개를 이어 불러온다
export const RANKING_PAGE_SIZE = 12;

// 분류와 필터 시트의 개수는 제품을 적재할 때만 바뀐다. 화면을 오갈 때마다 다시 받지 않는다
const CATEGORIES_STALE_MS = 5 * 60_000;

export const rankingQueries = {
  categories: () =>
    queryOptions({
      queryKey: rankingKeys.categories(),
      queryFn: ({ signal }) => fetchRankingCategories(api, signal),
      staleTime: CATEGORIES_STALE_MS,
    }),
  /** 칩 하나의 순위(무한 목록). 정렬 · 목표 · 필터가 바뀌면 키가 바뀌어 첫 페이지부터 다시 받는다 */
  list: (key: RankingListKey) =>
    infiniteQueryOptions({
      queryKey: rankingKeys.list(key),
      queryFn: ({ pageParam, signal }) =>
        fetchRanking(
          api,
          { ...key, page: pageParam, size: RANKING_PAGE_SIZE },
          signal,
        ),
      initialPageParam: 0,
      getNextPageParam: (lastPage) =>
        lastPage.hasNext ? lastPage.page + 1 : undefined,
      select: (data) => mergeRankingPages(data.pages),
    }),
  /** 대분류 전체(열린 칩마다 위 3개) */
  overview: (key: RankingOverviewKey) =>
    queryOptions({
      queryKey: rankingKeys.overview(key),
      queryFn: ({ signal }) => fetchRankingOverview(api, key, signal),
    }),
  /** 첫 화면(종류를 고르지 않았을 때): 대분류마다 중분류 1위 */
  leaders: (key: RankingLeadersKey) =>
    queryOptions({
      queryKey: rankingKeys.leaders(key),
      queryFn: ({ signal }) => fetchRankingLeaders(api, key, signal),
    }),
  /** 필터 시트. `category`는 칩 코드나 대분류 코드(서버가 필수로 받아 첫 화면에서는 부를 수 없다) */
  filters: (category: string, filters?: RankingFilters) =>
    queryOptions({
      queryKey: rankingKeys.filters(category, filters),
      queryFn: ({ signal }) =>
        fetchRankingFilters(api, { category, filters }, signal),
    }),
  /** 입력마다 키가 바뀌므로 디바운스는 화면이 붙인다 */
  brands: (category: string, rawQuery = "") => {
    const q = rawQuery.trim();
    return queryOptions({
      queryKey: rankingKeys.brands(category, q),
      queryFn: ({ signal }) => fetchRankingBrands(api, { category, q }, signal),
    });
  },
};

export function useRankingCategories() {
  return useQuery(rankingQueries.categories());
}

export function useRanking(key: RankingListKey) {
  return useInfiniteQuery(rankingQueries.list(key));
}

export function useRankingOverview(key: RankingOverviewKey) {
  return useQuery(rankingQueries.overview(key));
}

export function useRankingLeaders(key: RankingLeadersKey) {
  return useQuery(rankingQueries.leaders(key));
}

export function useRankingFilters(category: string, filters?: RankingFilters) {
  return useQuery(rankingQueries.filters(category, filters));
}

export function useRankingBrands(category: string, q?: string) {
  return useQuery(rankingQueries.brands(category, q));
}
