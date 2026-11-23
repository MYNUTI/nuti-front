import {
  infiniteQueryOptions,
  queryOptions,
  skipToken,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Goal } from "@/lib/goal/types";
import { fetchAlternatives, fetchProductDetail } from "@/lib/product/api";
import { productKeys } from "@/lib/product/keys";
import { lookupBarcode } from "@/lib/scan/lookup";
import type { Gtin } from "@/lib/scan/types";

// 서버 기본값과 같다
const ALTERNATIVES_PAGE_SIZE = 20;

export const productQueries = {
  barcode: (gtin: Gtin | null) =>
    queryOptions({
      queryKey: productKeys.barcode(gtin),
      queryFn: gtin ? ({ signal }) => lookupBarcode(gtin, signal) : skipToken,
      // 서버는 미등록·영양정보 부족 바코드를 조회할 때마다 분석 대기의 요청 수를 올린다. 캐시가 남아 있는
      // 동안(기본 gcTime 5분) 스캔 화면에 다시 들어와도 같은 바코드를 또 부르지 않게 한다. 목표가 바뀌면
      // 무효화로 다시 부른다
      staleTime: Infinity,
    }),
  detail: (productId: string) =>
    queryOptions({
      queryKey: productKeys.detail(productId),
      queryFn: ({ signal }) => fetchProductDetail(api, productId, { signal }),
      // 상세는 서버 컴포넌트가 조회해 HydrationBoundary로 넣는다. 서버가 조회마다 조회수를 올려
      // 클라이언트가 다시 조회하지 않게 한다. 값이 바뀌는 경우(저장·해제는 setQueryData, 목표 변경은
      // 무효화)는 변경 쪽에서 직접 고친다
      staleTime: Infinity,
    }),
  /** 3-4 더 맞는 제품. 점수는 `goal` 기준이라 목표마다 따로 캐시한다 */
  alternatives: (productId: string, goal: Goal) =>
    infiniteQueryOptions({
      queryKey: productKeys.alternatives(productId, goal),
      queryFn: ({ pageParam, signal }) =>
        fetchAlternatives(
          api,
          productId,
          { goal, page: pageParam, size: ALTERNATIVES_PAGE_SIZE },
          signal,
        ),
      initialPageParam: 0,
      getNextPageParam: (lastPage, _pages, lastPageParam) =>
        lastPage.hasNext ? lastPageParam + 1 : undefined,
    }),
};

export function useProductByBarcode(gtin: Gtin | null) {
  return useQuery(productQueries.barcode(gtin));
}

export function useProductDetail(productId: string) {
  return useQuery(productQueries.detail(productId));
}

export function useAlternatives(productId: string, goal: Goal) {
  return useInfiniteQuery(productQueries.alternatives(productId, goal));
}
