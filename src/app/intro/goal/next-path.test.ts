import { describe, expect, it } from "vitest";

import { toNextPath } from "./next-path";

describe("toNextPath", () => {
  it("제품 결과 주소는 그대로 받는다", () => {
    expect(toNextPath("/product/4")).toBe("/product/4");
    expect(toNextPath("/product/abc-12_3")).toBe("/product/abc-12_3");
  });

  it.each([
    ["바깥 주소", "https://evil.com"],
    ["프로토콜 생략 주소", "//evil.com"],
    ["상위 경로", "/product/../home"],
    ["더 깊은 경로", "/product/4/better"],
    ["쿼리가 붙은 주소", "/product/4?x=1"],
    ["다른 화면", "/home"],
    ["빈 값", ""],
  ])("%s는 버린다", (_, value) => {
    expect(toNextPath(value)).toBeUndefined();
  });

  it("값이 여러 개거나 없으면 버린다", () => {
    expect(toNextPath(["/product/1", "/product/2"])).toBeUndefined();
    expect(toNextPath(undefined)).toBeUndefined();
  });
});
