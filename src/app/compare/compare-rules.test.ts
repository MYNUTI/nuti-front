import { describe, expect, it } from "vitest";

import {
  bestIds,
  betterDirection,
  formatValue,
  roundValue,
  byScore,
} from "./compare-rules";

describe("betterDirection", () => {
  it("칼로리는 다이어트면 낮을수록, 근육 증가면 높을수록 낫다", () => {
    expect(betterDirection("calories", "diet")).toBe("lower");
    expect(betterDirection("calories", "muscle")).toBe("higher");
  });

  it("단백질은 높을수록, 나머지는 낮을수록 낫다(목표와 상관없이)", () => {
    for (const goal of ["diet", "muscle"] as const) {
      expect(betterDirection("protein", goal)).toBe("higher");
      for (const key of ["carbohydrate", "sugar", "fat", "sodium"] as const)
        expect(betterDirection(key, goal)).toBe("lower");
    }
  });
});

describe("bestIds", () => {
  const v = (id: string, value: number | null) => ({ id, value });

  it("가장 나은 값의 열을 고른다", () => {
    expect([...bestIds([v("a", 317), v("b", 413)], "lower")]).toEqual(["a"]);
    expect([...bestIds([v("a", 35), v("b", 37.7)], "higher")]).toEqual(["b"]);
  });

  it("가장 나은 값이 여럿이면 모두 고른다", () => {
    expect([...bestIds([v("a", 3), v("b", 3), v("c", 5)], "lower")]).toEqual([
      "a",
      "b",
    ]);
  });

  it("모두 같으면 아무것도 굵게 하지 않는다", () => {
    expect(bestIds([v("a", 3), v("b", 3)], "lower").size).toBe(0);
  });

  it("표시 없음은 빼고, 값 있는 열이 하나뿐이면 고르지 않는다", () => {
    expect([...bestIds([v("a", null), v("b", 5), v("c", 4)], "lower")]).toEqual(
      ["c"],
    );
    expect(bestIds([v("a", null), v("b", 5)], "lower").size).toBe(0);
  });
});

describe("byScore", () => {
  it("점수가 높은 제품을 앞으로, 같으면 담은 순서대로 둔다", () => {
    const list = [
      { id: "a", score: 62 },
      { id: "b", score: 92 },
      { id: "c", score: 62 },
    ];
    expect(byScore(list).map((p) => p.id)).toEqual(["b", "a", "c"]);
    expect(list.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});

describe("roundValue", () => {
  it("보이는 자리까지 반올림해, 같은 글자가 되는 값은 굵게 비교에서도 같다", () => {
    const v = (id: string, value: number) => ({ id, value });
    const calories = [
      v("a", roundValue(316.6, "kcal")),
      v("b", roundValue(317.2, "kcal")),
    ];
    expect(bestIds(calories, "lower").size).toBe(0);
    const sugar = [
      v("a", roundValue(3.33, "g")),
      v("b", roundValue(3.34, "g")),
    ];
    expect(bestIds(sugar, "lower").size).toBe(0);
  });
});

describe("formatValue", () => {
  it("kcal·mg는 정수, g는 소수 한 자리(0이면 뗀다)", () => {
    expect(formatValue(316.6, "kcal")).toBe("317kcal");
    expect(formatValue(233.4, "mg")).toBe("233mg");
    expect(formatValue(35, "g")).toBe("35g");
    expect(formatValue(3.33, "g")).toBe("3.3g");
  });

  it("천 단위 쉼표(⑩ 공통 규칙)", () => {
    expect(formatValue(2150, "mg")).toBe("2,150mg");
    expect(formatValue(1234.56, "g")).toBe("1,234.6g");
    expect(formatValue(0, "g")).toBe("0g");
  });
});
