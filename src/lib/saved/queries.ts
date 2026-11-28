import {
  infiniteQueryOptions,
  mutationOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Goal } from "@/lib/goal/types";
import { meKeys } from "@/lib/me/keys";
import { productKeys } from "@/lib/product/keys";
import type { ProductResult } from "@/lib/product/types";
import {
  deleteSavedProduct,
  fetchSavedProducts,
  postSavedProduct,
} from "@/lib/saved/api";
import { savedKeys } from "@/lib/saved/keys";
import { setSearchItemSaved } from "@/lib/search/queries";

// 서버 기본값과 같다
const SAVED_PAGE_SIZE = 20;

export const savedQueries = {
  /** 4-4 즐겨찾기. `goal`은 화면의 내 목표(`useDeviceGoal`, 없으면 WEIGHT_LOSS)를 넘긴다 */
  list: (goal: Goal) =>
    infiniteQueryOptions({
      queryKey: savedKeys.list(goal),
      queryFn: ({ pageParam, signal }) =>
        fetchSavedProducts(
          api,
          { goal, page: pageParam, size: SAVED_PAGE_SIZE },
          signal,
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _pages, lastPageParam) =>
        lastPage.hasNext ? lastPageParam + 1 : undefined,
    }),
};

export function useSavedProducts(goal: Goal) {
  return useInfiniteQuery(savedQueries.list(goal));
}

// 성공 후 다시 불러올 조회는 API 작업 플랜 「기능 → 엔드포인트 매핑」을 따른다(09단계 확정).
// 마이는 저장 수(`recordCount`)를 보여 준다

// 상품 상세는 다시 조회하면 조회수가 올라 캐시의 `saved`만 바꾼다(플랜 03단계 결정)
function setDetailSaved(
  queryClient: QueryClient,
  productId: string,
  saved: boolean,
) {
  queryClient.setQueryData<ProductResult>(
    productKeys.detail(productId),
    (detail) => detail && { ...detail, saved },
  );
}

export const savedMutations = {
  save: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (productId: string) => postSavedProduct(api, productId),
      onSuccess: (_result, productId) => {
        setDetailSaved(queryClient, productId, true);
        setSearchItemSaved(queryClient, productId, true);
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: savedKeys.all }),
          queryClient.invalidateQueries({ queryKey: meKeys.summary() }),
        ]);
      },
    }),
  remove: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (productId: string) => deleteSavedProduct(api, productId),
      onSuccess: (_result, productId) => {
        setDetailSaved(queryClient, productId, false);
        setSearchItemSaved(queryClient, productId, false);
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: savedKeys.all }),
          queryClient.invalidateQueries({ queryKey: meKeys.summary() }),
        ]);
      },
    }),
};

export function useSaveProduct() {
  return useMutation(savedMutations.save(useQueryClient()));
}

export function useRemoveSavedProduct() {
  return useMutation(savedMutations.remove(useQueryClient()));
}
