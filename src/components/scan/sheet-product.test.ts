import { describe, expect, it } from "vitest";

import type { ScannedProduct } from "@/lib/product/types";

import { toSheetProduct } from "./sheet-product";

type Analyzed = Extract<ScannedProduct, { status: "ANALYZED" }>;

function analyzed(overrides: Partial<Analyzed> = {}): Analyzed {
  return {
    status: "ANALYZED",
    grade: {
      score: 88,
      grade: "B",
      label: "괜찮아요",
      badgeText: null,
      fiberIncluded: true,
    },
    topReason: "당이 조금 높아요",
    product: {
      id: "7",
      name: "두유",
      brandName: "정식품",
      imageUrl: "https://example.com/7.png",
      servingSize: "190ml",
      sourceNote: null,
    },
    appliedGoal: "WEIGHT_LOSS",
    ...overrides,
  };
}

describe("toSheetProduct", () => {
  it("조회 결과를 시트 모양으로 옮긴다", () => {
    expect(toSheetProduct(analyzed())).toEqual({
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
  });

  it.each([
    ["A", 1],
    ["C", 3],
    ["E", 5],
  ] as const)("등급 %s는 점수 구간 %i이다", (grade, band) => {
    const scanned = analyzed();
    expect(
      toSheetProduct({ ...scanned, grade: { ...scanned.grade, grade } }).band,
    ).toBe(band);
  });

  it.each([
    ["MUSCLE_GAIN", "근육 증가 목표"],
    ["GENERAL", null],
  ] as const)("목표 %s의 문구는 %s다", (appliedGoal, label) => {
    expect(toSheetProduct(analyzed({ appliedGoal })).goalLabel).toBe(label);
  });

  it("감점 요인이 없으면 설명이 없다", () => {
    expect(toSheetProduct(analyzed({ topReason: null })).summary).toBeNull();
  });
});
