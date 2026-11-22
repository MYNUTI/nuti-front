import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import { toBarcodeScan, toProductResult } from "@/lib/product/mapper";
import type {
  ProductResultDto,
  ProductViewSource,
  ScanResultDto,
} from "@/lib/product/types";

// 인스턴스를 인자로 받아 브라우저(`api`)와 서버 컴포넌트(`serverApi`)가 같은 함수를 쓴다

/**
 * 미등록도 200(`NOT_FOUND`)으로 답하고 서버가 새 제품 요청을 자동 등록한다(같은 바코드는 횟수 +1).
 * 체크섬이 틀리면 400 `BARCODE_CHECKSUM_INVALID`로 reject한다
 */
export function fetchProductByBarcode(
  http: AxiosInstance,
  barcode: string,
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<ScanResultDto>>(
      `/products/barcode/${encodeURIComponent(barcode)}`,
      { signal },
    )
    .then(unwrap)
    .then(toBarcodeScan);
}

/**
 * 없거나 비활성이면 404 `PRODUCT_NOT_FOUND`. 서버는 호출마다 조회수를 올리고, 식별이 있으면 최근 본
 * 제품에 `source`(들어온 경로)와 함께 남긴다. 점수가 없는 제품은 성분값 보강 요청을 자동 등록한다
 */
export function fetchProductDetail(
  http: AxiosInstance,
  productId: string,
  { source, signal }: { source?: ProductViewSource; signal?: AbortSignal } = {},
) {
  return http
    .get<ApiSuccess<ProductResultDto>>(
      `/products/${encodeURIComponent(productId)}`,
      { params: { source }, signal },
    )
    .then(unwrap)
    .then(toProductResult);
}
