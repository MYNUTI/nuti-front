import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { fetchProductByBarcode } from "@/lib/product/api";
import type { ScannedProduct } from "@/lib/product/types";
import type { Gtin } from "@/lib/scan/types";

export type BarcodeLookupOutcome =
  | { status: "found"; product: ScannedProduct }
  /** 정상 응답이다. 미등록이면 서버가 분석 대기 목록에 등록했다(비활성 상품도 같은 404지만 등록하지 않는다) */
  | { status: "not-found"; gtin: Gtin }
  /** 서버의 체크섬 검사에 걸렸다. 다시 보내도 같아 재시도할 실패가 아니다 */
  | { status: "checksum-invalid"; gtin: Gtin };

/**
 * GTIN으로 상품을 찾는다. 카메라·사진·직접 입력 모두 이 함수를 거친다.
 *
 * 상세는 내부 상품 ID로 라우팅하므로(`/product/[id]`) 조회 없이 상세로 가는 경로는 없다.
 * 결과가 없는 것은 결과로 돌려주고, 네트워크·서버 실패만 reject한다 — 재시도와 에러 상태는
 * TanStack Query가 맡는다.
 *
 * 서버가 8·12·13·14자리를 정규화하므로 GTIN-14를 그대로 보낸다. 단 14자리는 앞자리가 0이어야 하고,
 * 아니면 400 `BAD_REQUEST`로 reject된다. 묶음 포장(GTIN-14 표시자 1~9)이라 서버 DB에 있을 수 없는
 * 번호지만, 입력 단계에서 막지 않고 조회 실패로 보인다(API 플랜 결정 기록 2026-11-19).
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
