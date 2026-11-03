import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fetchGradeReason, fetchProductDetail } from "@/lib/product/api";
import { productKeys } from "@/lib/product/keys";
import type { Goal } from "@/lib/product/types";
import { lookupBarcode } from "@/lib/scan/lookup";
import type { Gtin } from "@/lib/scan/types";

export const productQueries = {
  barcode: (gtin: Gtin | null) =>
    queryOptions({
      queryKey: productKeys.barcode(gtin),
      queryFn: gtin ? ({ signal }) => lookupBarcode(gtin, signal) : skipToken,
    }),
  detail: (productId: string) =>
    queryOptions({
      queryKey: productKeys.detail(productId),
      queryFn: ({ signal }) => fetchProductDetail(api, productId, signal),
      // 상세는 서버 컴포넌트가 조회해 HydrationBoundary로 넣는다. 서버가 조회마다 조회수를 올려
      // 클라이언트가 다시 조회하지 않게 한다. 값이 바뀌는 경우(저장·해제는 setQueryData, 목표 변경은
      // 무효화)는 변경 쪽에서 직접 고친다
      staleTime: Infinity,
    }),
  gradeReason: (productId: string, goal?: Goal) =>
    queryOptions({
      queryKey: productKeys.gradeReason(productId, goal),
      queryFn: ({ signal }) => fetchGradeReason(api, productId, goal, signal),
    }),
};

export function useProductByBarcode(gtin: Gtin | null) {
  return useQuery(productQueries.barcode(gtin));
}

export function useProductDetail(productId: string) {
  return useQuery(productQueries.detail(productId));
}

export function useGradeReason(productId: string, goal?: Goal) {
  return useQuery(productQueries.gradeReason(productId, goal));
}
