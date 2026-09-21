import { findProductByGtin } from "@/lib/product";
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
