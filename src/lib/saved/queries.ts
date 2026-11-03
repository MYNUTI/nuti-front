import {
  infiniteQueryOptions,
  mutationOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { meKeys } from "@/lib/me/keys";
import { productKeys } from "@/lib/product/keys";
import type { ProductDetail } from "@/lib/product/types";
import {
  deleteSavedProduct,
  fetchSavedProducts,
  postSavedProduct,
} from "@/lib/saved/api";
import { savedKeys } from "@/lib/saved/keys";
import { setSearchItemSaved } from "@/lib/search/queries";

// 서버 기본값과 같다
const SAVED_PAGE_SIZE = 10;

export const savedQueries = {
  /** 토큰·익명 ID가 모두 없으면 403이다. `bootstrap.isLoggedIn`이거나 `consentAgreed`일 때만 부른다 */
  list: () =>
    infiniteQueryOptions({
      queryKey: savedKeys.list(),
      queryFn: ({ pageParam, signal }) =>
        fetchSavedProducts(
          api,
          { page: pageParam, size: SAVED_PAGE_SIZE },
          signal,
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _pages, lastPageParam) =>
        lastPage.hasNext ? lastPageParam + 1 : undefined,
    }),
};

export function useSavedProducts({ enabled = true } = {}) {
  return useInfiniteQuery({ ...savedQueries.list(), enabled });
}

// 성공 후 다시 불러올 조회는 API 작업 플랜 「기능 → 엔드포인트 매핑」의 초안이고 09단계에서 확정한다.
// 마이는 저장 수(`recordCount`)를 보여 준다

// 상품 상세는 다시 조회하면 조회수가 올라 캐시의 `saved`만 바꾼다(플랜 03단계 결정)
function setDetailSaved(
  queryClient: QueryClient,
  productId: string,
  saved: boolean,
) {
  queryClient.setQueryData<ProductDetail>(
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
