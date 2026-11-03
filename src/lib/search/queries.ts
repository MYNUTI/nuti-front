import {
  infiniteQueryOptions,
  queryOptions,
  skipToken,
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Goal } from "@/lib/goal/types";
import {
  fetchPopularKeywords,
  fetchSearch,
  fetchSearchSuggestions,
} from "@/lib/search/api";
import { searchKeys } from "@/lib/search/keys";
import { mergeSearchPages } from "@/lib/search/mapper";
import type { SearchItem, SearchResult } from "@/lib/search/types";

// 서버 기본값과 같다
const SEARCH_PAGE_SIZE = 20;

export const searchQueries = {
  /** 서버가 trim해 검색하므로 키와 요청도 trim한 값을 쓴다. 빈 검색어는 서버가 400으로 답해 보내지 않는다 */
  result: (rawQuery: string, goal?: Goal) => {
    const q = rawQuery.trim();
    return infiniteQueryOptions({
      queryKey: searchKeys.result(q, goal),
      queryFn: q
        ? ({ pageParam, signal }) =>
            fetchSearch(
              api,
              { q, goal, page: pageParam, size: SEARCH_PAGE_SIZE },
              signal,
            )
        : skipToken,
      initialPageParam: 0,
      // 두 섹션이 같은 page로 넘어가 어느 한쪽이라도 남았으면 다음 페이지가 있다
      getNextPageParam: (lastPage, _pages, lastPageParam) =>
        (lastPageParam + 1) * SEARCH_PAGE_SIZE <
        Math.max(lastPage.exactMatches.total, lastPage.similarProducts.total)
          ? lastPageParam + 1
          : undefined,
      select: (data) => mergeSearchPages(data.pages),
    });
  },
  /**
   * 서버는 trim한 길이가 30자를 넘으면 400, 정규화한 뒤 1자 이하면 빈 배열로 답해 그때는 보내지 않는다.
   * 입력마다 키가 바뀌므로 디바운스와 `keepPreviousData`는 화면이 붙인다
   */
  suggestions: (rawQuery: string) => {
    const q = rawQuery.trim();
    return queryOptions({
      queryKey: searchKeys.suggestions(q),
      queryFn:
        q.length >= 2 && q.length <= 30
          ? ({ signal }) => fetchSearchSuggestions(api, q, signal)
          : skipToken,
    });
  },
  popularKeywords: () =>
    queryOptions({
      queryKey: searchKeys.popularKeywords(),
      queryFn: ({ signal }) => fetchPopularKeywords(api, signal),
    }),
};

export function useSearch(q: string, goal?: Goal) {
  return useInfiniteQuery(searchQueries.result(q, goal));
}

export function useSearchSuggestions(q: string) {
  return useQuery(searchQueries.suggestions(q));
}

export function usePopularKeywords() {
  return useQuery(searchQueries.popularKeywords());
}

/**
 * 저장·해제 뒤 캐시된 검색 결과의 저장 표시만 바꾼다. 검색을 다시 부르면 불러 둔 페이지를 모두 다시
 * 받아야 하고, 저장 여부는 정렬에 영향이 없다.
 */
export function setSearchItemSaved(
  queryClient: QueryClient,
  productId: string,
  saved: boolean,
) {
  const mark = (item: SearchItem) =>
    item.id === productId ? { ...item, saved } : item;
  const markPage = (page: SearchResult): SearchResult => ({
    ...page,
    exactMatches: {
      ...page.exactMatches,
      items: page.exactMatches.items.map(mark),
    },
    similarProducts: {
      ...page.similarProducts,
      items: page.similarProducts.items.map(mark),
    },
    sameCategoryTop: page.sameCategoryTop.map(mark),
  });
  queryClient.setQueriesData<InfiniteData<SearchResult, number>>(
    { queryKey: searchKeys.results() },
    (data) => data && { ...data, pages: data.pages.map(markPage) },
  );
}
