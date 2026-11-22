import { describe, expect, it } from "vitest";
import { toBarcodeScan, toProductResult } from "@/lib/product/mapper";
import { goalResultDto, productResultDto } from "@/test/product";

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
      price: null,
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
      price: 1500,
      priceCheckedAt: "2026-11-20T10:00:00",
      priceStale: true,
      isAd: true,
      adNotice: "쿠팡 파트너스 활동으로 수수료를 받을 수 있어요",
    };
    expect(toProductResult(productResultDto({ purchase })).purchase).toEqual({
      matchType: "EXACT",
      url: purchase.url,
      price: 1500,
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
