import { describe, expect, it } from "vitest";
import { productKeys } from "@/lib/product/keys";

describe("productKeys", () => {
  it("모든 키는 상품 키로 시작한다", () => {
    for (const key of [
      productKeys.barcode("08801062633029"),
      productKeys.detail("7"),
      productKeys.alternatives("7", "WEIGHT_LOSS"),
    ])
      expect(key[0]).toBe(productKeys.all[0]);
  });

  it("더 맞는 제품은 목표마다 키가 다르다", () => {
    expect(productKeys.alternatives("7", "WEIGHT_LOSS")).not.toEqual(
      productKeys.alternatives("7", "MUSCLE_GAIN"),
    );
  });
});
