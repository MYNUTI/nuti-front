import { describe, expect, it } from "vitest";
import {
  toGradeReason,
  toProductDetail,
  toScannedProduct,
} from "@/lib/product/mapper";
import type {
  BarcodeScanDto,
  GradeBadgeDto,
  ProductDetailDto,
} from "@/lib/product/types";

const grade: GradeBadgeDto = {
  score: 72.5,
  grade: "B",
  label: "목표에 잘 맞아요",
  badgeText: "분류 비교 전",
  fiberIncluded: true,
};

const analyzedScan: BarcodeScanDto = {
  status: "ANALYZED",
  product: {
    productId: 1024,
    name: "그릭요거트",
    brandName: "누티",
    imageUrl: "https://cdn.example/1024.png",
    servingSize: "100g",
  },
  grade,
  topReason: "당류가 1회 제공량에 12g 들어 있어요",
  appliedGoal: "GENERAL",
};

// 서버는 INSUFFICIENT면 grade·topReason 키를 빼고 보낸다
const insufficientScan: BarcodeScanDto = {
  status: "INSUFFICIENT",
  product: {
    productId: 2048,
    name: "이름만 있는 과자",
    brandName: null,
    imageUrl: null,
    servingSize: null,
  },
  appliedGoal: "WEIGHT_LOSS",
};

// 서버가 키를 빼고 보낸 응답을 만든다
function omit<T extends object, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const copy = { ...value };
  delete copy[key];
  return copy;
}

describe("toScannedProduct", () => {
  it("분석 완료면 등급과 감점 이유를 담는다", () => {
    expect(toScannedProduct(analyzedScan)).toEqual({
      status: "ANALYZED",
      grade,
      topReason: "당류가 1회 제공량에 12g 들어 있어요",
      product: {
        id: "1024",
        name: "그릭요거트",
        brandName: "누티",
        imageUrl: "https://cdn.example/1024.png",
        servingSize: "100g",
        sourceNote: null,
      },
      appliedGoal: "GENERAL",
    });
  });

  it("영양정보 부족이면 등급 없이 상품 정보만 담는다", () => {
    const result = toScannedProduct(insufficientScan);
    expect(result).toEqual({
      status: "INSUFFICIENT",
      product: {
        id: "2048",
        name: "이름만 있는 과자",
        brandName: null,
        imageUrl: null,
        servingSize: null,
        sourceNote: null,
      },
      appliedGoal: "WEIGHT_LOSS",
    });
    expect(result).not.toHaveProperty("grade");
    expect(result).not.toHaveProperty("topReason");
  });

  it("분석 완료인데 감점 요인이 없으면 topReason이 null이다", () => {
    expect(toScannedProduct(omit(analyzedScan, "topReason"))).toMatchObject({
      status: "ANALYZED",
      grade,
      topReason: null,
    });
  });

  it("ANALYZED인데 등급이 빠져 오면 분석 전으로 본다", () => {
    expect(toScannedProduct(omit(analyzedScan, "grade")).status).toBe(
      "INSUFFICIENT",
    );
  });
});

describe("toProductDetail", () => {
  const detail: ProductDetailDto = {
    ...analyzedScan,
    product: { ...analyzedScan.product, sourceNote: "식품안전나라 기준" },
    nutrition: {
      calories: 95,
      protein: 9.5,
      sugar: 12,
      saturatedFat: 1.2,
      transFat: 0,
      cholesterol: 10,
      sodium: 55,
      dietaryFiber: null,
    },
    saved: true,
  };

  it("영양정보·저장 여부·출처 문구를 담는다", () => {
    const result = toProductDetail(detail);
    expect(result).toMatchObject({
      status: "ANALYZED",
      saved: true,
      nutrition: detail.nutrition,
    });
    expect(result.product.sourceNote).toBe("식품안전나라 기준");
  });

  it("영양정보 행이 없으면 nutrition이 null이다", () => {
    expect(
      toProductDetail({ ...insufficientScan, saved: false }),
    ).toMatchObject({
      status: "INSUFFICIENT",
      nutrition: null,
      saved: false,
    });
  });
});

describe("toGradeReason", () => {
  const reason = {
    appliedGoal: "MUSCLE_GAIN" as const,
    factors: [
      {
        nutrient: "SUGAR" as const,
        label: "당류",
        value: 12,
        unit: "g",
        threshold: 10,
        sentence: "근육 증가 목표에서는 당류를 줄이는 게 좋아요",
      },
    ],
    methodology: { steps: ["100g 기준으로 계산해요"], note: null },
  };

  it("식이섬유 안내가 없으면 null이다", () => {
    expect(toGradeReason(reason)).toEqual({ ...reason, fiberNotice: null });
  });

  it("식이섬유 안내를 넘긴다", () => {
    expect(
      toGradeReason({
        ...reason,
        fiberNotice: "식이섬유 값이 없어 0으로 계산했어요",
      }).fiberNotice,
    ).toBe("식이섬유 값이 없어 0으로 계산했어요");
  });
});
