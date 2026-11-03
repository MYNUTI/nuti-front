import type { Gtin } from "@/lib/scan/types";
import type { Goal } from "@/lib/product/types";

// 등급 근거는 상세 키 아래에 둔다. 상세를 무효화하면(목표 변경 등) 근거도 함께 다시 불러온다
export const productKeys = {
  all: ["product"] as const,
  /** 바코드를 아직 못 읽었으면 null. 그때는 조회하지 않는다 */
  barcode: (gtin: Gtin | null) =>
    [...productKeys.all, "barcode", gtin] as const,
  detail: (productId: string) =>
    [...productKeys.all, "detail", productId] as const,
  gradeReason: (productId: string, goal?: Goal) =>
    [...productKeys.detail(productId), "grade-reason", goal ?? null] as const,
};
