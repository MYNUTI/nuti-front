import { describe, expect, it } from "vitest";

import { resultCopy } from "./result-copy";

describe("resultCopy", () => {
  it("2,500 · 3,000은 바뀌는 것 + 그대로인 것, 그 기준으로 보기", () => {
    const copy = resultCopy(2500);
    expect(copy.sections.map((s) => s.heading)).toEqual([
      "바뀌는 것",
      "그대로인 것",
    ]);
    expect(copy.sections[0].body).toContain("2,500kcal 기준으로 다시 계산해요");
    expect(copy.button).toBe("2,500kcal 기준으로 보기");
    expect(resultCopy(3000).button).toBe("3,000kcal 기준으로 보기");
  });

  it("2,000은 점수가 그대로라 한 구역 · 확인했어요", () => {
    const copy = resultCopy(2000);
    expect(copy.sections).toHaveLength(1);
    expect(copy.sections[0].heading).toBe("점수는 그대로예요");
    expect(copy.button).toBe("확인했어요");
  });

  it("1,500은 점수가 낮아질 수 있다고 알린다", () => {
    const copy = resultCopy(1500);
    expect(copy.sections[0].body).toContain(
      "칼로리가 높은 제품의 점수가 낮아질 수 있어요",
    );
    expect(copy.button).toBe("1,500kcal 기준으로 보기");
  });
});
