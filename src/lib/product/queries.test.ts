import { describe, expect, it } from "vitest";
import { productQueries } from "@/lib/product/queries";

describe("productQueries", () => {
  it("바코드 조회와 상세는 다시 부르지 않는다(조회마다 서버 부수 효과가 있다)", () => {
    expect(productQueries.barcode("08801062633029").staleTime).toBe(Infinity);
    expect(productQueries.detail("7").staleTime).toBe(Infinity);
  });

  it("더 맞는 제품은 0쪽부터 hasNext가 있을 때만 다음 쪽을 부른다", () => {
    const options = productQueries.alternatives("7", "WEIGHT_LOSS");
    expect(options.initialPageParam).toBe(0);
    const page = (hasNext: boolean) => ({
      current: {} as never,
      goal: "WEIGHT_LOSS" as const,
      kcalBand: 2000,
      total: 0,
      hasNext,
      items: [],
    });
    expect(options.getNextPageParam(page(true), [], 0, [])).toBe(1);
    expect(options.getNextPageParam(page(false), [], 0, [])).toBeUndefined();
  });
});
