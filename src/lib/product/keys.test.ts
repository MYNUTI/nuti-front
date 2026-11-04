import { describe, expect, it } from "vitest";
import { productKeys } from "@/lib/product/keys";

describe("productKeys", () => {
  it("등급 근거 키는 상세 키로 시작해 상세 무효화에 함께 걸린다", () => {
    const detail = productKeys.detail("7");
    expect(productKeys.gradeReason("7").slice(0, detail.length)).toEqual(
      detail,
    );
    expect(productKeys.gradeReason("7", "WEIGHT_LOSS")).not.toEqual(
      productKeys.gradeReason("7"),
    );
  });

  it("모든 키는 상품 키로 시작한다", () => {
    for (const key of [
      productKeys.barcode("08801062633029"),
      productKeys.detail("7"),
      productKeys.gradeReason("7"),
    ])
      expect(key[0]).toBe(productKeys.all[0]);
  });
});
