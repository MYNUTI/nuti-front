import { describe, expect, it } from "vitest";
import { productKeys } from "@/lib/product/keys";

describe("productKeys", () => {
  it("모든 키는 상품 키로 시작한다", () => {
    for (const key of [
      productKeys.barcode("08801062633029"),
      productKeys.detail("7"),
    ])
      expect(key[0]).toBe(productKeys.all[0]);
  });
});
