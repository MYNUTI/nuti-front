import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import {
  toGradeReason,
  toProductDetail,
  toScannedProduct,
} from "@/lib/product/mapper";
import type {
  BarcodeScanDto,
  Goal,
  GradeReasonDto,
  ProductDetailDto,
} from "@/lib/product/types";

// 인스턴스를 인자로 받아 브라우저(`api`)와 서버 컴포넌트(`serverApi`)가 같은 함수를 쓴다

/** 미등록이면 404 `PRODUCT_NOT_FOUND`, 체크섬이 틀리면 400 `BARCODE_CHECKSUM_INVALID`로 reject한다 */
export function fetchProductByBarcode(
  http: AxiosInstance,
  barcode: string,
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<BarcodeScanDto>>(
      `/products/barcode/${encodeURIComponent(barcode)}`,
      { signal },
    )
    .then(unwrap)
    .then(toScannedProduct);
}

/** 없거나 비활성이면 404 `PRODUCT_NOT_FOUND`. 서버는 호출마다 조회수를 올린다 */
export function fetchProductDetail(
  http: AxiosInstance,
  productId: string,
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<ProductDetailDto>>(
      `/products/${encodeURIComponent(productId)}`,
      { signal },
    )
    .then(unwrap)
    .then(toProductDetail);
}

/** 등급 없는 상품은 409 `GRADE_NOT_AVAILABLE`. `goal`을 빼면 서버가 사용자의 목표로 계산한다 */
export function fetchGradeReason(
  http: AxiosInstance,
  productId: string,
  goal?: Goal,
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<GradeReasonDto>>(
      `/products/${encodeURIComponent(productId)}/grade-reason`,
      { params: { goal }, signal },
    )
    .then(unwrap)
    .then(toGradeReason);
}
