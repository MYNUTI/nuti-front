import { describe, expect, it } from "vitest";

import { goalPickerFrom, goalPickerHref, toGoalNextPath } from "./next-path";

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
});

describe("goalPickerHref", () => {
  it("돌아올 주소만 넘긴다(목표는 기기에 있다)", () => {
    expect(goalPickerHref("/search?q=바")).toBe(
      "/my/goal?next=%2Fsearch%3Fq%3D%25EB%25B0%2594",
    );
    expect(goalPickerHref("/ranking/01S4?sort=PROTEIN")).toBe(
      "/my/goal?next=%2Franking%2F01S4%3Fsort%3DPROTEIN",
    );
  });

  it("한 번만 띄우는 계정 삭제 알림 값은 돌아올 주소에서 뺀다", () => {
    expect(goalPickerHref("/home?state=deleted&seller=CU")).toBe(
      "/my/goal?next=%2Fhome%3Fseller%3DCU",
    );
    expect(goalPickerHref("/home?state=deleted")).toBe("/my/goal?next=%2Fhome");
  });

  it("받는 화면이 아니면 돌아올 주소를 빼고 연다", () => {
    expect(goalPickerHref("/product/4")).toBe("/my/goal");
  });
});

describe("goalPickerFrom", () => {
  it("돌아갈 주소로 들어온 화면 코드를 정한다", () => {
    expect(goalPickerFrom("/home")).toBe("2-1");
    expect(goalPickerFrom("/search?q=a")).toBe("2-4");
    expect(goalPickerFrom("/ranking/01S4")).toBe("2-2");
  });

  it("돌아갈 주소가 없으면 5-1에서 왔다", () => {
    expect(goalPickerFrom(undefined)).toBe("5-1");
  });
});
