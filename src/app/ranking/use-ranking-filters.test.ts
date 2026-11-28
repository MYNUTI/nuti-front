import { describe, expect, it } from "vitest";

import { NO_FILTERS } from "./model";
import { addedFilters } from "./use-ranking-filters";

describe("addedFilters", () => {
  it("새로 건 값만 탭마다 로그 이름으로 돌려준다", () => {
    expect(
      addedFilters(
        { ...NO_FILTERS, sellers: ["CU"] },
        {
          sellers: ["CU", "COUPANG"],
          brands: ["하림"],
          nutrients: ["LOW_SUGAR"],
        },
      ),
    ).toEqual([
      { filterType: "seller", filterValue: "COUPANG" },
      { filterType: "brand", filterValue: "하림" },
      { filterType: "nutrient", filterValue: "LOW_SUGAR" },
    ]);
  });

  it("뺀 값 · 그대로 둔 값은 보내지 않는다", () => {
    expect(
      addedFilters(
        { ...NO_FILTERS, sellers: ["CU", "COUPANG"] },
        { ...NO_FILTERS, sellers: ["CU"] },
      ),
    ).toEqual([]);
  });
});
