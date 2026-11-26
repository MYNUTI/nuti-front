import { describe, expect, it } from "vitest";

import { passThrough } from "./pass-through";

describe("passThrough", () => {
  it("넘길 값만 골라 바코드는 GTIN-14로 맞춘다", () => {
    const result = passThrough({
      name: " 웨하스 ",
      brand: "",
      gtin: "8801000000036",
      state: "failed",
    });
    expect(result.query).toBe(
      "name=%EC%9B%A8%ED%95%98%EC%8A%A4&gtin=08801000000036",
    );
    expect(result.gtin).toBe("08801000000036");
    expect(result.labelHref).toBe(`/contribute/label?${result.query}`);
  });

  it("숫자 8~14자리가 아닌 바코드와 여러 개 온 값은 버린다", () => {
    const result = passThrough({ gtin: "12ab", product: ["p1", "p2"] });
    expect(result).toEqual({
      query: "",
      gtin: null,
      labelHref: "/contribute/label",
    });
  });
});
