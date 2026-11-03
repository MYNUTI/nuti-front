import { describe, expect, it } from "vitest";
import { toGoalUpdate, toMyGoal } from "@/lib/goal/mapper";

describe("goal mapper", () => {
  it("미설정이라 appliedAt이 빠지면 null이다", () => {
    expect(
      toMyGoal({ goal: "GENERAL", label: "일반", healthConsented: false }),
    ).toEqual({
      goal: "GENERAL",
      label: "일반",
      healthConsented: false,
      appliedAt: null,
    });
  });

  it("재계산 상품 ID를 문자열로 바꾸고, 재계산이 없으면 null 그대로다", () => {
    const base = {
      goal: "WEIGHT_LOSS" as const,
      label: "체중 감량",
      appliedAt: "2026-11-03T10:00:00",
    };
    expect(toGoalUpdate({ ...base, recalculation: null }).recalculation).toBe(
      null,
    );
    expect(
      toGoalUpdate({
        ...base,
        recalculation: {
          productId: 7,
          name: "두유",
          before: { grade: "B", label: "잘 맞아요" },
          after: { grade: "C", label: "목표에 잘 안 맞아요" },
          changed: true,
          reason: "체중 감량 목표 기준으로 다시 계산해 B에서 C로 바뀌었어요.",
        },
      }).recalculation,
    ).toMatchObject({ productId: "7", changed: true });
  });
});
