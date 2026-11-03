import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { findProductByGtin } from "@/lib/mock-catalog";
import { fetchProductByBarcode } from "@/lib/product/api";
import type { ScannedProduct } from "@/lib/product/types";
import type { Gtin, ScanResult } from "@/lib/scan/types";

export type LookupOutcome =
  | { status: "found"; result: ScanResult }
  /** 정상 응답이다. 갈 상세 페이지가 없으므로 IA 3-6 미등록 화면으로 보내야 한다. */
  | { status: "not-found"; gtin: Gtin };

/**
 * GTIN으로 상품을 찾는다.
 *
 * 상세는 내부 상품 ID로 라우팅하므로(`/product/[id]`) 조회 없이 상세로 가는 경로는 없다.
 * 카메라·사진·직접 입력 모두 이 포트를 거친다.
 *
 * 네트워크 실패는 결과에 담지 않고 reject한다 — 재시도와 에러 상태는 TanStack Query가
 * 맡는다. "없음"은 실패가 아니므로 결과로 구분한다.
 */
export type LookupProduct = (
  gtin: Gtin,
  signal?: AbortSignal,
) => Promise<LookupOutcome>;

export const lookupProduct: LookupProduct = async (gtin) => {
  const product = findProductByGtin(gtin);
  if (!product) return { status: "not-found", gtin };

  return {
    status: "found",
    result: {
      id: product.id,
      name: product.name,
      summary: product.summary,
      grade: product.grade,
    },
  };
};

export type BarcodeLookupOutcome =
  | { status: "found"; product: ScannedProduct }
  /** 정상 응답이다. 미등록이면 서버가 분석 대기 목록에 등록했다(비활성 상품도 같은 404지만 등록하지 않는다) */
  | { status: "not-found"; gtin: Gtin }
  /** 서버의 체크섬 검사에 걸렸다. 다시 보내도 같아 재시도할 실패가 아니다 */
  | { status: "checksum-invalid"; gtin: Gtin };

/**
 * 실제 API로 GTIN을 조회한다. 계약은 `lookupProduct`와 같다 — 결과가 없는 것은 결과로, 네트워크·서버
 * 실패만 reject한다. 화면을 API에 연결할 때 `lookupProduct`(목)와 `ScanResult`를 이것으로 바꾼다.
 * 서버가 8·12·13·14자리를 정규화하므로 GTIN-14를 그대로 보낸다. 단 14자리는 앞자리가 0이어야 하고,
 * 아니면 400 `BAD_REQUEST`로 reject된다. 다시 보내도 같아 화면 연결 때 직접 입력에서 미리 막을지 정한다.
 */
export async function lookupBarcode(
  gtin: Gtin,
  signal?: AbortSignal,
): Promise<BarcodeLookupOutcome> {
  try {
    const product = await fetchProductByBarcode(api, gtin, signal);
    return { status: "found", product };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "PRODUCT_NOT_FOUND")
        return { status: "not-found", gtin };
      if (error.code === "BARCODE_CHECKSUM_INVALID")
        return { status: "checksum-invalid", gtin };
    }
    throw error;
  }
}
