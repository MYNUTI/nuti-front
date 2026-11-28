import { describe, expect, it } from "vitest";
import { toProductCard } from "@/lib/product/mapper";
import { productCardDto } from "@/test/product";

import { toCardInput } from "./to-card";

describe("toCardInput", () => {
  it("요청 목표의 점수를 정수로, 등급을 점수 구간으로 바꾸고 태그를 옮긴다", () => {
    const card = toProductCard(
      productCardDto({
        imageUrl: "https://img.example/7.jpg",
        goals: [
          { goal: "WEIGHT_LOSS", score: 88.5, grade: "B", label: "맞는 편" },
          { goal: "MUSCLE_GAIN", score: 40.2, grade: "D", label: "안 맞는 편" },
        ],
      }),
    );
    expect(toCardInput(card, "MUSCLE_GAIN")).toEqual({
      id: "7",
      brand: "정식품",
      name: "두유",
      image: "https://img.example/7.jpg",
      imageSize: 400,
      score: 40,
      band: 4,
      tags: [{ label: "단백질 많음" }, { label: "당류 많음" }],
    });
  });

  it("영양소 정렬이면 태그 자리에 서버의 값 글을 넣는다", () => {
    const card = toProductCard(
      productCardDto({
        sortValue: {
          nutrient: "PROTEIN",
          value: 21,
          unit: "g",
          basis: "100g",
          text: "단백질 21g · 100g당",
        },
      }),
    );
    expect(toCardInput(card, "WEIGHT_LOSS").tags).toEqual([
      { label: "단백질 21g · 100g당" },
    ]);
  });

  it("점수가 없는 제품은 점수 · 구간이 null, 브랜드가 없으면 빈 글자", () => {
    const card = toProductCard(
      productCardDto({ goals: [], brandLine: null, state: "NO_SCORE" }),
    );
    expect(toCardInput(card, "WEIGHT_LOSS")).toMatchObject({
      brand: "",
      score: null,
      band: null,
    });
  });
});
