import { describe, expect, it } from "vitest";
import { toProductCard, toProductResult } from "@/lib/product/mapper";
import type { NutrientRowDto } from "@/lib/product/types";
import {
  goalResultDto,
  productCardDto,
  productResultDto,
} from "@/test/product";

import {
  toBetterItems,
  toScore,
  toScreenProduct,
  toServing,
} from "./to-screen";

const amount = (value: number | null, dvPercent: number | null = null) => ({
  value,
  dvPercent,
  level: null,
  levelLabel: dvPercent === null ? null : "보통",
});

const row = (
  nutrient: NutrientRowDto["nutrient"],
  overrides: Partial<NutrientRowDto> = {},
): NutrientRowDto => ({
  nutrient,
  label: nutrient,
  unit: "g",
  per100g: amount(1, 2),
  perServing: null,
  missing: false,
  tones: null,
  ...overrides,
});

describe("toScreenProduct", () => {
  it("내 목표 결과를 점수 · 등급 구간 · 이유로, 다른 목표를 미리 보기로 둔다", () => {
    const product = toProductResult(
      productResultDto({
        goals: [
          goalResultDto("WEIGHT_LOSS", {
            score: 62,
            grade: "C",
            goods: [
              {
                nutrient: "PROTEIN",
                text: "단백질이 많아요",
                missing: false,
                note: null,
              },
            ],
            bads: [
              {
                nutrient: "CALORIES",
                text: "칼로리가 높은 편이에요",
                missing: false,
                note: null,
              },
            ],
          }),
          goalResultDto("MUSCLE_GAIN", { score: 91, grade: "A" }),
        ],
      }),
    );
    expect(toScreenProduct(product, "diet", [])).toMatchObject({
      goal: "diet",
      score: 62,
      band: 3,
      rank: null,
      reasons: { good: ["단백질이 많아요"], bad: ["칼로리가 높은 편이에요"] },
      preview: { muscle: { score: 91, band: 1 } },
    });
    expect(toScreenProduct(product, "muscle", [])).toMatchObject({
      score: 91,
      band: 1,
      preview: { diet: { score: 62, band: 3 } },
    });
  });

  it("점수가 없는 제품은 null", () => {
    const product = toProductResult(
      productResultDto({ state: "NO_SCORE", goals: [] }),
    );
    expect(toScreenProduct(product, "diet", [])).toBeNull();
  });

  it("칼로리 · 단백질 · 당류를 처음 보이는 줄로, 나머지는 서버 순서대로 펼치는 줄로 나눈다", () => {
    const product = toProductResult(
      productResultDto({
        basis: "100g",
        nutrients: [
          row("SODIUM"),
          row("SUGAR"),
          row("FAT"),
          row("CALORIES", { unit: "kcal", perServing: amount(165, 8) }),
          row("PROTEIN"),
        ],
      }),
    );
    const { nutrition } = toScreenProduct(product, "diet", [])!;
    expect(nutrition.unit).toBe("g");
    expect(nutrition.main.map((n) => n.key)).toEqual([
      "CALORIES",
      "PROTEIN",
      "SUGAR",
    ]);
    expect(nutrition.more.map((n) => n.key)).toEqual(["SODIUM", "FAT"]);
    expect(nutrition.main[0]).toEqual({
      key: "CALORIES",
      label: "CALORIES",
      unit: "kcal",
      per100: { value: 1, dvPercent: 2, levelLabel: "보통" },
      perServing: { value: 165, dvPercent: 8, levelLabel: "보통" },
    });
  });

  it("판매 중이 아니면 받은 상태 글자를 생산 상태로 둔다", () => {
    const of = (state: "ANALYZED" | "STOCK_REMAINING") =>
      toScreenProduct(
        toProductResult(
          productResultDto({ state, stateLabel: "생산 중단 · 재고 판매 중" }),
        ),
        "diet",
        [],
      )!.production;
    expect(of("ANALYZED")).toBeNull();
    expect(of("STOCK_REMAINING")).toEqual({
      label: "생산 중단 · 재고 판매 중",
    });
  });

  it("구매 링크: 정확히 찾은 상품은 가격 줄, 이름 검색뿐이면 품절 모양, 없으면 쿠팡을 뺀다", () => {
    const of = (purchase: Parameters<typeof productResultDto>[0]) =>
      toScreenProduct(toProductResult(productResultDto(purchase)), "diet", [])!;
    expect(
      of({
        purchase: {
          matchType: "EXACT",
          url: "https://link.coupang.com/a",
          price: 12900,
          priceCheckedAt: "2026-11-16T09:00:00",
          isAd: true,
        },
      }),
    ).toMatchObject({
      coupangUrl: "https://link.coupang.com/a",
      coupangSoldOut: false,
      coupangPrice: { kind: "single", amount: 12900, date: "2026-11-16" },
    });
    expect(
      of({
        purchase: {
          matchType: "NAME_SEARCH",
          url: "https://link.coupang.com/s",
          isAd: true,
        },
      }),
    ).toMatchObject({
      coupangUrl: "https://link.coupang.com/s",
      coupangSoldOut: true,
      coupangPrice: null,
    });
    expect(of({ purchase: { matchType: "NONE", isAd: false } })).toMatchObject({
      coupangUrl: null,
      coupangPrice: null,
    });
  });

  it("다른 용량: 묶음 수 · 1개당 값을 읽었으면 묶음 가격 줄, 못 읽었으면 「다른 용량」", () => {
    const of = (purchase: Parameters<typeof productResultDto>[0]) =>
      toScreenProduct(toProductResult(productResultDto(purchase)), "diet", [])!
        .coupangPrice;
    expect(
      of({
        purchase: {
          matchType: "OTHER_SIZE",
          url: "https://link.coupang.com/b",
          saleStatus: "ON_SALE",
          bundleCount: 6,
          unitPrice: 2150,
          priceCheckedAt: "2026-11-16T09:00:00",
          isAd: true,
        },
      }),
    ).toEqual({
      kind: "bundle",
      count: 6,
      unitAmount: 2150,
      date: "2026-11-16",
    });
    expect(
      of({
        purchase: {
          matchType: "OTHER_SIZE",
          url: "https://link.coupang.com/b",
          saleStatus: "ON_SALE",
          isAd: true,
        },
      }),
    ).toEqual({ kind: "otherSize" });
  });

  it("판매 상태를 확인하지 못했으면 정확히 찾은 상품이어도 가격 없이 「쿠팡에서 찾아보기」", () => {
    expect(
      toScreenProduct(
        toProductResult(
          productResultDto({
            purchase: {
              matchType: "EXACT",
              url: "https://link.coupang.com/s",
              saleStatus: "UNKNOWN",
              isAd: true,
            },
          }),
        ),
        "diet",
        [],
      ),
    ).toMatchObject({ coupangSoldOut: true, coupangPrice: null });
  });

  it("하루 칼로리가 기본값(2,000)이 아닐 때만 내 몸에 맞춘 것으로 본다", () => {
    const of = (kcalBand: number) =>
      toScreenProduct(
        toProductResult(productResultDto({ kcalBand })),
        "diet",
        [],
      )!.bodyFitKcal;
    expect(of(2000)).toBeNull();
    expect(of(1600)).toBe(1600);
  });

  it("분류 · 사진 · 환자용 · 저장 여부를 옮긴다", () => {
    const product = toScreenProduct(
      toProductResult(
        productResultDto({
          category: { code: "01S4", name: "프로틴바·간식" },
          imageUrl: "https://img.example/7.jpg",
          patientFoodNote: "환자용 식품이에요",
          saved: true,
        }),
      ),
      "diet",
      [],
    )!;
    expect(product).toMatchObject({
      category: "프로틴바·간식",
      categoryCode: "01S4",
      image: { src: "https://img.example/7.jpg" },
      patientFood: true,
      saved: true,
    });
  });
});

describe("toServing", () => {
  it("성분표 글자에서 양을 떼어 이름만 남긴다", () => {
    expect(toServing({ text: "1개(40g)", amount: 40, unit: "g" })).toEqual({
      label: "1개",
      amount: 40,
    });
  });

  it("양만 적혀 있으면 「1회 제공량」", () => {
    expect(toServing({ text: "190 mL", amount: 190, unit: "mL" })).toEqual({
      label: "1회 제공량",
      amount: 190,
    });
  });

  it("양을 못 읽었거나 1회 제공량이 없으면 null", () => {
    expect(toServing({ text: "1봉지", amount: null, unit: null })).toBeNull();
    expect(toServing(null)).toBeNull();
  });
});

describe("toBetterItems", () => {
  it("내 목표 점수 · 등급 구간과 나아진 두 성분으로 카드를 만든다", () => {
    const card = toProductCard(
      productCardDto({ productId: 11, imageUrl: "https://img.example/11.jpg" }),
    );
    const diff = (text: string) => ({
      nutrient: "X",
      label: "X",
      unit: "g",
      diff: -1,
      text,
    });
    expect(
      toBetterItems(
        [
          {
            product: card,
            diffs: [
              diff("칼로리 −90kcal"),
              diff("당류 −8.3g"),
              diff("나트륨 −1mg"),
            ],
          },
        ],
        "muscle",
      ),
    ).toEqual([
      {
        id: "11",
        brand: "정식품",
        name: "두유",
        image: "https://img.example/11.jpg",
        imageSize: 400,
        score: 40,
        band: 4,
        tags: [{ label: "단백질 많음" }, { label: "당류 많음" }],
        diff: "칼로리 −90kcal, 당류 −8.3g",
      },
    ]);
  });

  it("점수가 없는 카드는 뺀다", () => {
    const card = toProductCard(productCardDto({ goals: [] }));
    expect(toBetterItems([{ product: card, diffs: [] }], "diet")).toEqual([]);
  });
});

describe("toScore", () => {
  it("소수 한 자리 점수를 점수 링과 같은 정수로 맞춘다", () => {
    expect(toScore(72.4)).toBe(72);
    expect(toScore(72.5)).toBe(73);
  });

  it("내 목표 · 미리 보기 · 더 맞는 제품 점수가 모두 정수다", () => {
    const product = toScreenProduct(
      toProductResult(
        productResultDto({
          goals: [
            goalResultDto("WEIGHT_LOSS", { score: 61.6 }),
            goalResultDto("MUSCLE_GAIN", { score: 90.2 }),
          ],
        }),
      ),
      "diet",
      [
        {
          product: toProductCard(
            productCardDto({
              goals: [
                {
                  goal: "WEIGHT_LOSS",
                  score: 88.5,
                  grade: "B",
                  label: "맞는 편",
                },
                {
                  goal: "MUSCLE_GAIN",
                  score: 40,
                  grade: "D",
                  label: "안 맞는 편",
                },
              ],
            }),
          ),
          diffs: [],
        },
      ],
    )!;
    expect(product.score).toBe(62);
    expect(product.preview.muscle?.score).toBe(90);
    expect(product.better[0].score).toBe(89);
  });
});
