import { describe, expect, it } from "vitest";

import type { Goal } from "@/lib/goal/types";
import { toProductResult } from "@/lib/product/mapper";
import type { GoalResult, ProductResult } from "@/lib/product/types";
import { goalResultDto, productResultDto } from "@/test/product";

import { toSheetProduct } from "./sheet-product";

type Scored = ProductResult & { goals: Record<Goal, GoalResult> };

function scored(...args: Parameters<typeof productResultDto>): Scored {
  const product = toProductResult(productResultDto(...args));
  if (!product.goals) throw new Error("두 목표 점수가 있는 제품이어야 한다");
  return { ...product, goals: product.goals };
}

describe("toSheetProduct", () => {
  it("결과를 시트 모양으로 옮긴다. 점수·한 줄 해석은 내 목표 기준이다", () => {
    const product = scored({
      brandLine: "정식품",
      imageUrl: "https://example.com/7.png",
      goals: [
        goalResultDto("WEIGHT_LOSS", {
          score: 88,
          grade: "B",
          summary: "당이 조금 높아요",
        }),
        goalResultDto("MUSCLE_GAIN", {
          score: 40,
          grade: "D",
          summary: "단백질이 적어요",
        }),
      ],
    });

    expect(toSheetProduct(product, "WEIGHT_LOSS")).toEqual({
      id: "7",
      name: "두유",
      brand: "정식품",
      imageUrl: "https://example.com/7.png",
      score: 88,
      band: 2,
      rank: null,
      goalLabel: "다이어트 목표",
      summary: "당이 조금 높아요",
    });
    expect(toSheetProduct(product, "MUSCLE_GAIN")).toMatchObject({
      score: 40,
      band: 4,
      goalLabel: "근육 증가 목표",
      summary: "단백질이 적어요",
    });
  });

  it.each([
    ["A", 1],
    ["C", 3],
    ["E", 5],
  ] as const)("등급 %s는 점수 구간 %i이다", (grade, band) => {
    const product = scored({
      goals: [
        goalResultDto("WEIGHT_LOSS", { grade }),
        goalResultDto("MUSCLE_GAIN"),
      ],
    });
    expect(toSheetProduct(product, "WEIGHT_LOSS").band).toBe(band);
  });
});
