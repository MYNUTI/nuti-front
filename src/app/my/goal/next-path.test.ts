import { describe, expect, it } from "vitest";

import { goalPickerHref, toGoalNextPath, withGoal } from "./next-path";

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

describe("goalPickerHref", () => {
  it("지금 목표와 돌아올 주소를 넘긴다", () => {
    expect(goalPickerHref("diet", "/search?q=바")).toBe(
      "/my/goal?goal=diet&next=%2Fsearch%3Fq%3D%25EB%25B0%2594",
    );
    expect(goalPickerHref("muscle", "/ranking/01S4?goal=muscle")).toBe(
      "/my/goal?goal=muscle&next=%2Franking%2F01S4%3Fgoal%3Dmuscle",
    );
  });

  it("한 번만 띄우는 계정 삭제 알림 값은 돌아올 주소에서 뺀다", () => {
    expect(goalPickerHref("diet", "/home?state=deleted&seller=CU")).toBe(
      "/my/goal?goal=diet&next=%2Fhome%3Fseller%3DCU",
    );
    expect(goalPickerHref("diet", "/home?state=deleted")).toBe(
      "/my/goal?goal=diet&next=%2Fhome",
    );
  });

  it("받는 화면이 아니면 돌아올 주소를 빼고 연다", () => {
    expect(goalPickerHref("diet", "/product/4")).toBe("/my/goal?goal=diet");
  });
});
