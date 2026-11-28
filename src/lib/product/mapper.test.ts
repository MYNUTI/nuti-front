import { describe, expect, it } from "vitest";
import {
  toAlternativesPage,
  toBarcodeScan,
  toProductCard,
  toProductResult,
} from "@/lib/product/mapper";
import {
  goalResultDto,
  productCardDto,
  productResultDto,
} from "@/test/product";

describe("toProductResult", () => {
  it("상품 ID를 문자열로 바꾸고 두 목표를 목표별로 묶는다", () => {
    const result = toProductResult(productResultDto());
    expect(result.id).toBe("7");
    expect(result.goals?.WEIGHT_LOSS).toMatchObject({ goal: "WEIGHT_LOSS" });
    expect(result.goals?.MUSCLE_GAIN).toMatchObject({ goal: "MUSCLE_GAIN" });
  });

  it("점수가 없으면(goals 빈 배열) goals가 null이다", () => {
    expect(
      toProductResult(productResultDto({ state: "NO_SCORE", goals: [] })).goals,
    ).toBeNull();
  });

  it("한 목표만 오면 다른 목표 점수를 지어내지 않고 null이다", () => {
    expect(
      toProductResult(
        productResultDto({ goals: [goalResultDto("WEIGHT_LOSS")] }),
      ).goals,
    ).toBeNull();
  });

  it("구매 링크에서 빠진 키는 null로, 가격 지남 여부는 false로 채운다", () => {
    expect(toProductResult(productResultDto()).purchase).toEqual({
      matchType: "NONE",
      url: null,
      saleStatus: null,
      price: null,
      per100Price: null,
      per100Unit: null,
      bundleCount: null,
      unitPrice: null,
      priceCheckedAt: null,
      priceStale: false,
      isAd: false,
      adNotice: null,
    });
  });

  it("구매 링크가 있으면 그대로 담는다", () => {
    const purchase = {
      vendor: "COUPANG",
      url: "https://link.coupang.com/a/1",
      matchType: "EXACT" as const,
      saleStatus: "ON_SALE" as const,
      price: 1500,
      per100Price: 3750,
      per100Unit: "g",
      unitPrice: 1500,
      priceCheckedAt: "2026-11-20T10:00:00",
      priceStale: true,
      isAd: true,
      adNotice: "쿠팡 파트너스 활동으로 수수료를 받을 수 있어요",
    };
    expect(toProductResult(productResultDto({ purchase })).purchase).toEqual({
      matchType: "EXACT",
      url: purchase.url,
      saleStatus: "ON_SALE",
      price: 1500,
      per100Price: 3750,
      per100Unit: "g",
      bundleCount: null,
      unitPrice: 1500,
      priceCheckedAt: purchase.priceCheckedAt,
      priceStale: true,
      isAd: true,
      adNotice: purchase.adNotice,
    });
  });
});

describe("toBarcodeScan", () => {
  it.each(["RESULT", "NO_SCORE"] as const)(
    "%s는 결과 화면 모델을 담는다",
    (outcome) => {
      expect(
        toBarcodeScan({
          outcome,
          barcode: "8801062633029",
          result: productResultDto(),
          candidates: null,
        }),
      ).toMatchObject({ outcome, product: { id: "7" } });
    },
  );

  it("MULTIPLE은 후보 ID를 문자열로 바꾼다", () => {
    expect(
      toBarcodeScan({
        outcome: "MULTIPLE",
        barcode: "8801062633029",
        result: null,
        candidates: [
          {
            productId: 8,
            name: "두유 190ml",
            brandLine: null,
            imageUrl: null,
            state: "ANALYZED",
            stateLabel: "분석 완료",
          },
        ],
      }),
    ).toEqual({
      outcome: "MULTIPLE",
      barcode: "8801062633029",
      candidates: [
        {
          id: "8",
          name: "두유 190ml",
          brandLine: null,
          imageUrl: null,
          state: "ANALYZED",
          stateLabel: "분석 완료",
        },
      ],
    });
  });

  it("NOT_FOUND는 서버가 정규화한 바코드만 담는다", () => {
    expect(
      toBarcodeScan({
        outcome: "NOT_FOUND",
        barcode: "8801062633029",
        result: null,
        candidates: null,
      }),
    ).toEqual({ outcome: "NOT_FOUND", barcode: "8801062633029" });
  });
});

describe("toProductCard", () => {
  it("ID를 문자열로 바꾸고 두 목표를 목표별로 묶는다. 빠진 sortValue·better는 null이다", () => {
    expect(toProductCard(productCardDto())).toEqual({
      id: "7",
      name: "두유",
      brandLine: "정식품",
      imageUrl: null,
      state: "ANALYZED",
      stateLabel: "분석 완료",
      goals: {
        WEIGHT_LOSS: {
          goal: "WEIGHT_LOSS",
          score: 88,
          grade: "B",
          label: "맞는 편",
        },
        MUSCLE_GAIN: {
          goal: "MUSCLE_GAIN",
          score: 40,
          grade: "D",
          label: "안 맞는 편",
        },
      },
      tags: ["단백질 많음", "당류 많음"],
      sortValue: null,
      better: null,
      saved: false,
    });
  });

  it("점수가 없는 카드는 goals가 null이다", () => {
    expect(
      toProductCard(productCardDto({ state: "NO_SCORE", goals: [] })).goals,
    ).toBeNull();
  });

  it("더 맞는 제품 표시가 오면 담는다", () => {
    expect(
      toProductCard(
        productCardDto({ better: { status: "AVAILABLE", count: 3 } }),
      ).better,
    ).toEqual({ status: "AVAILABLE", count: 3 });
  });
});

describe("toAlternativesPage", () => {
  it("지금 제품과 후보 카드를 바꾸고 성분 차이는 그대로 둔다", () => {
    const diff = {
      nutrient: "CALORIES",
      label: "칼로리",
      unit: "kcal",
      diff: -29,
      text: "칼로리 −29kcal",
    };
    expect(
      toAlternativesPage({
        current: productCardDto(),
        goal: "WEIGHT_LOSS",
        kcalBand: 2000,
        total: 1,
        page: 0,
        size: 20,
        hasNext: false,
        items: [{ product: productCardDto({ productId: 8 }), diffs: [diff] }],
      }),
    ).toMatchObject({
      current: { id: "7" },
      goal: "WEIGHT_LOSS",
      total: 1,
      hasNext: false,
      items: [{ product: { id: "8" }, diffs: [diff] }],
    });
  });
});
