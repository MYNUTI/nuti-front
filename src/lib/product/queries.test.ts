import { describe, expect, it } from "vitest";
import { productQueries } from "@/lib/product/queries";

describe("productQueries", () => {
  it("바코드 조회와 상세는 다시 부르지 않는다(조회마다 서버 부수 효과가 있다)", () => {
    expect(productQueries.barcode("08801062633029").staleTime).toBe(Infinity);
    expect(productQueries.detail("7").staleTime).toBe(Infinity);
  });
});
