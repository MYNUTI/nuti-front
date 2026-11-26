import { describe, expect, it } from "vitest";

import { fixtureAlternatives, fixtureSearch } from "./_fixtures";

describe("fixtureSearch", () => {
  it("점수 높은 순이 기본이고 점수 없는 제품은 맨 뒤", () => {
    const { items, total } = fixtureSearch("프로틴바", "score");
    expect(total).toBe(items.length);
    const scores = items.map((i) => i.score);
    expect(scores.at(-1)).toBeNull();
    const scored = scores.filter((s): s is number => s !== null);
    expect(scored).toEqual([...scored].sort((a, b) => b - a));
  });

  it("영양소 정렬도 값이 없는 제품은 맨 뒤", () => {
    const calories = fixtureSearch("프로틴바", "calories").items;
    expect(calories.at(-1)?.per100).toBeNull();
    const values = calories.flatMap((i) =>
      i.per100 ? [i.per100.calories] : [],
    );
    expect(values).toEqual([...values].sort((a, b) => a - b));
    const protein = fixtureSearch("프로틴바", "protein").items;
    expect(protein[0].per100?.protein).toBe(
      Math.max(...protein.flatMap((i) => (i.per100 ? [i.per100.protein] : []))),
    );
  });

  it("검색어가 제품 이름 전체와 같으면 맨 위에 따로 둔다", () => {
    const result = fixtureSearch("카카오초코 프로틴바", "score");
    expect(result.exact?.id).toBe("4");
    expect(result.items.some((i) => i.id === "4")).toBe(false);
    expect(result.total).toBe(result.items.length + 1);
  });

  it("브랜드 이름으로도 찾고, 없으면 0건", () => {
    expect(fixtureSearch("미트리", "score").items.map((i) => i.id)).toEqual([
      "4",
    ]);
    expect(fixtureSearch("없는말", "score")).toMatchObject({
      total: 0,
      category: null,
    });
  });

  it("당류 적은 순은 값이 작은 제품부터", () => {
    const values = fixtureSearch("프로틴바", "sugar").items.flatMap((i) =>
      i.per100 ? [i.per100.sugar] : [],
    );
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it("초성으로도 찾는다", () => {
    expect(fixtureSearch("ㅋㅋㅇㅊㅋ", "score").items.map((i) => i.id)).toEqual(
      ["4"],
    );
  });

  it("빈 검색어는 0건", () => {
    expect(fixtureSearch("  ", "score").total).toBe(0);
  });
});

describe("fixtureAlternatives", () => {
  it("띄어쓰기를 붙인 말 · 같은 뜻으로 바꾼 말 · 마지막 낱말", () => {
    expect(fixtureAlternatives("단백질 웨하스")).toEqual([
      "단백질웨하스",
      "프로틴 웨하스",
      "웨하스",
    ]);
  });

  it("찾은 말과 같거나 겹치는 후보는 뺀다", () => {
    expect(fixtureAlternatives("웨하스")).toEqual([]);
  });
});
