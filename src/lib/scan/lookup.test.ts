import { describe, expect, it } from "vitest";
import { isValidGtinChecksum, toGtin14 } from "@/lib/scan/gtin";
import { MOCK_PRODUCT_GTINS } from "@/lib/product";
import { lookupProduct } from "@/lib/scan/lookup";

describe("lookupProduct (목)", () => {
  it.each(MOCK_PRODUCT_GTINS)("목 키 %s는 정규화된 유효 GTIN-14다", (gtin) => {
    expect(gtin).toHaveLength(14);
    expect(toGtin14(gtin)).toBe(gtin);
    expect(isValidGtinChecksum(gtin)).toBe(true);
  });

  it("스캔한 13자리를 정규화해 넘기면 찾는다", async () => {
    const outcome = await lookupProduct(toGtin14("8801062633029"));
    expect(outcome.status).toBe("found");
  });

  it("찾은 결과의 id는 GTIN이 아닌 내부 상품 ID다", async () => {
    const outcome = await lookupProduct(toGtin14("8801062633029"));
    if (outcome.status !== "found") throw new Error("unreachable");
    expect(outcome.result.id).not.toContain("8801062633029");
  });

  it("없는 상품은 실패가 아니라 not-found 결과다", async () => {
    await expect(lookupProduct(toGtin14("96385074"))).resolves.toEqual({
      status: "not-found",
      gtin: "00000096385074",
    });
  });
});
