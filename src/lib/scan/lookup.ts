import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { fetchProductByBarcode } from "@/lib/product/api";
import type { BarcodeScan } from "@/lib/product/types";
import type { Gtin } from "@/lib/scan/types";

/** 바코드 조회 결과. 체크섬 오류도 다시 보내도 같아 실패가 아니라 결과로 돌려준다 */
export type BarcodeLookupOutcome =
  BarcodeScan | { outcome: "CHECKSUM_INVALID"; gtin: Gtin };

/**
 * GTIN으로 상품을 찾는다. 카메라·사진·직접 입력 모두 이 함수를 거친다.
 *
 * 상세는 내부 상품 ID로 라우팅하므로(`/product/[id]`) 조회 없이 상세로 가는 경로는 없다.
 * 결과가 없는 것(미등록·여러 개·점수 없음·체크섬 오류)은 결과로 돌려주고, 네트워크·서버 실패만
 * reject한다 — 재시도와 에러 상태는 TanStack Query가 맡는다.
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
    return await fetchProductByBarcode(api, gtin, signal);
  } catch (error) {
    if (error instanceof ApiError && error.code === "BARCODE_CHECKSUM_INVALID")
      return { outcome: "CHECKSUM_INVALID", gtin };
    throw error;
  }
}
