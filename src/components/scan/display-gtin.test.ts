import { describe, expect, it } from "vitest";

import { displayGtin } from "./display-gtin";

describe("화면에 보일 바코드 번호", () => {
  it("GTIN-14 앞의 0을 떼고 포장에 찍힌 자릿수로 보인다", () => {
    expect(displayGtin("08801234567893")).toBe("8801234567893");
    expect(displayGtin("00012345678905")).toBe("012345678905");
    expect(displayGtin("00000096385074")).toBe("96385074");
    expect(displayGtin("18801234567890")).toBe("18801234567890");
  });

  it("앞이 0인 EAN-8 · 비표준 자릿수 · 모두 0", () => {
    expect(displayGtin("00000001234565")).toBe("01234565");
    // 9자리로 넣은 번호는 가장 가까운 표준 자릿수(12)로 보인다
    expect(displayGtin("00000123456789")).toBe("000123456789");
    expect(displayGtin("00000000000000")).toBe("00000000");
  });
});
