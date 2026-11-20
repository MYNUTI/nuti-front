import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { api } from "@/lib/api/client";
import {
  fetchRanking,
  fetchRankingBrands,
  fetchRankingCategories,
  fetchRankingFilters,
  fetchRankingOverview,
} from "@/lib/ranking/api";
import {
  rankingKeys,
  type RankingListKey,
  type RankingOverviewKey,
  type RankingSourceId,
} from "@/lib/ranking/keys";
import { mergeRankingPages } from "@/lib/ranking/mapper";
import type { RankingFilters } from "@/lib/ranking/types";

/**
 * 요청을 보낼 곳. 기본은 실제 서버(`liveRanking`)이고, 검토용 화면은 예시 자료를 돌려주는 axios
 * 인스턴스를 넣어 같은 API 함수·mapper·훅을 그대로 태운다.
 */
export type RankingSource = { id: RankingSourceId; http: AxiosInstance };

export const liveRanking: RankingSource = { id: "live", http: api };

// 디자인 메모(2-2): 목록 끝에 닿을 때마다 다음 12개를 이어 불러온다
export const RANKING_PAGE_SIZE = 12;

// 분류와 필터 시트의 개수는 제품을 적재할 때만 바뀐다. 화면을 오갈 때마다 다시 받지 않는다
const CATEGORIES_STALE_MS = 5 * 60_000;

export const rankingQueries = {
  categories: (source: RankingSource = liveRanking) =>
    queryOptions({
      queryKey: rankingKeys.categories(source.id),
      queryFn: ({ signal }) => fetchRankingCategories(source.http, signal),
      staleTime: CATEGORIES_STALE_MS,
    }),
  /** 칩 하나의 순위(무한 목록). 정렬·목표·필터가 바뀌면 키가 바뀌어 첫 페이지부터 다시 받는다 */
  list: (key: RankingListKey, source: RankingSource = liveRanking) =>
    infiniteQueryOptions({
      queryKey: rankingKeys.list(source.id, key),
      queryFn: ({ pageParam, signal }) =>
        fetchRanking(
          source.http,
          { ...key, page: pageParam, size: RANKING_PAGE_SIZE },
          signal,
        ),
      initialPageParam: 0,
      getNextPageParam: (lastPage) =>
        lastPage.hasNext ? lastPage.page + 1 : undefined,
      select: (data) => mergeRankingPages(data.pages),
    }),
  overview: (key: RankingOverviewKey, source: RankingSource = liveRanking) =>
    queryOptions({
      queryKey: rankingKeys.overview(source.id, key),
      queryFn: ({ signal }) => fetchRankingOverview(source.http, key, signal),
    }),
  filters: (
    category: string,
    filters?: RankingFilters,
    source: RankingSource = liveRanking,
  ) =>
    queryOptions({
      queryKey: rankingKeys.filters(source.id, category, filters),
      queryFn: ({ signal }) =>
        fetchRankingFilters(source.http, { category, filters }, signal),
    }),
  /** 입력마다 키가 바뀌므로 디바운스는 화면이 붙인다 */
  brands: (
    category: string,
    rawQuery = "",
    source: RankingSource = liveRanking,
  ) => {
    const q = rawQuery.trim();
    return queryOptions({
      queryKey: rankingKeys.brands(source.id, category, q),
      queryFn: ({ signal }) =>
        fetchRankingBrands(source.http, { category, q }, signal),
    });
  },
};

export function useRankingCategories(source?: RankingSource) {
  return useQuery(rankingQueries.categories(source));
}

export function useRanking(key: RankingListKey, source?: RankingSource) {
  return useInfiniteQuery(rankingQueries.list(key, source));
}

export function useRankingOverview(
  key: RankingOverviewKey,
  source?: RankingSource,
) {
  return useQuery(rankingQueries.overview(key, source));
}

/**
 * 대분류 여러 개의 전체 순위를 한꺼번에 받는다. 「종류를 고르지 않았을 때」가 대분류마다 한 번씩 부른다 —
 * 대분류를 묶어 주는 엔드포인트가 없다. 결과는 넘긴 `majors` 순서 그대로다.
 */
export function useRankingOverviews(
  majors: string[],
  key: Omit<RankingOverviewKey, "major">,
  source?: RankingSource,
) {
  return useQueries({
    queries: majors.map((major) =>
      rankingQueries.overview({ ...key, major }, source),
    ),
  });
}

export function useRankingFilters(
  category: string,
  filters?: RankingFilters,
  source?: RankingSource,
) {
  return useQuery(rankingQueries.filters(category, filters, source));
}

export function useRankingBrands(
  category: string,
  q?: string,
  source?: RankingSource,
) {
  return useQuery(rankingQueries.brands(category, q, source));
}
