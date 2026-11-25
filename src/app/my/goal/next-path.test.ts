import { describe, expect, it } from "vitest";

import { toGoalNextPath, withGoal } from "./next-path";

describe("toGoalNextPath", () => {
  it("홈 · 검색 결과 · 랭킹 주소는 받는다", () => {
    expect(toGoalNextPath("/home")).toBe("/home");
    expect(toGoalNextPath("/search?q=%EB%B0%94")).toBe("/search?q=%EB%B0%94");
    expect(toGoalNextPath("/ranking?seller=CU")).toBe("/ranking?seller=CU");
  });

  it("다른 주소 · 다른 사이트 · 여러 값은 버린다", () => {
    expect(toGoalNextPath("/my")).toBeUndefined();
    expect(toGoalNextPath("/homepage")).toBeUndefined();
    expect(toGoalNextPath("//evil.example/home")).toBeUndefined();
    expect(toGoalNextPath("https://evil.example/home")).toBeUndefined();
    expect(toGoalNextPath(["/home", "/search"])).toBeUndefined();
    expect(toGoalNextPath(undefined)).toBeUndefined();
  });

  it("정규화하면 다른 사이트 · 다른 화면이 되는 주소는 버린다", () => {
    expect(toGoalNextPath("/home/..//evil.example")).toBeUndefined();
    expect(toGoalNextPath("/home/../\\evil.example")).toBeUndefined();
    expect(toGoalNextPath("/search/%2e%2e//evil.example")).toBeUndefined();
    expect(toGoalNextPath("/home/../my")).toBeUndefined();
  });

  it("목표를 붙여도 같은 사이트 주소로 남는다", () => {
    // 정규화해도 받는 주소(빈 세그먼트 포함)가 `//다른 사이트`로 바뀌지 않는다
    for (const value of ["/home", "/search?q=a", "/home//x"]) {
      expect(withGoal(toGoalNextPath(value)!, "diet")).toMatch(/^\/(?!\/)/);
    }
  });
});

describe("withGoal", () => {
  it("목표를 붙이고 다른 값은 둔다", () => {
    expect(withGoal("/home", "muscle")).toBe("/home?goal=muscle");
    expect(withGoal("/search?q=a&sort=kcal", "diet")).toBe(
      "/search?q=a&sort=kcal&goal=diet",
    );
  });

  it("이미 있던 목표는 바꾼다", () => {
    expect(withGoal("/home?goal=diet", "muscle")).toBe("/home?goal=muscle");
  });
});
