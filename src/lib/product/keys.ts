import type { Goal } from "@/lib/goal/types";
import type { Gtin } from "@/lib/scan/types";

export const productKeys = {
  all: ["product"] as const,
  /** 바코드를 아직 못 읽었으면 null. 그때는 조회하지 않는다 */
  barcode: (gtin: Gtin | null) =>
    [...productKeys.all, "barcode", gtin] as const,
  detail: (productId: string) =>
    [...productKeys.all, "detail", productId] as const,
  alternatives: (productId: string, goal: Goal) =>
    [...productKeys.all, "alternatives", productId, goal] as const,
};
