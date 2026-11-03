import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import { toSavedProductPage } from "@/lib/saved/mapper";
import type { SaveResultDto, SavedProductPageDto } from "@/lib/saved/types";

/** 최근 저장순. `page`는 1부터. 토큰·익명 ID가 모두 없으면 403 `CONSENT_REQUIRED` */
export function fetchSavedProducts(
  http: AxiosInstance,
  params: { page: number; size: number },
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<SavedProductPageDto>>("/me/saved-products", {
      params,
      signal,
    })
    .then(unwrap)
    .then(toSavedProductPage);
}

/**
 * 이미 저장했어도 200. 토큰·익명 ID가 모두 없으면 403 `CONSENT_REQUIRED`, 없거나 비활성이면 404
 * `PRODUCT_NOT_FOUND`, 200개를 넘으면 409 `SAVE_LIMIT_EXCEEDED`
 */
export function postSavedProduct(http: AxiosInstance, productId: string) {
  return http
    .post<ApiSuccess<SaveResultDto>>(
      `/me/saved-products/${encodeURIComponent(productId)}`,
    )
    .then(unwrap);
}

/** 저장돼 있지 않아도 200. 토큰·익명 ID가 모두 없으면 403 `CONSENT_REQUIRED` */
export function deleteSavedProduct(http: AxiosInstance, productId: string) {
  return http
    .delete<ApiSuccess<SaveResultDto>>(
      `/me/saved-products/${encodeURIComponent(productId)}`,
    )
    .then(unwrap);
}
