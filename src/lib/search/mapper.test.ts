import { describe, expect, it } from "vitest";
import {
  mergeSearchPages,
  toSearchResult,
  toSearchSuggestion,
} from "@/lib/search/mapper";
import type { SearchDto, SearchItemDto } from "@/lib/search/types";

const analyzed: SearchItemDto = {
  productId: 7,
  name: "두유",
  brandName: "누티",
  imageUrl: null,
  status: "ANALYZED",
  grade: "C",
  gradeLabel: "보통이에요",
  highlight: "당류 21g — 체중 감량 기준 초과",
  isSaved: true,
};

const insufficient: SearchItemDto = {
  productId: 8,
  name: "과자",
  brandName: null,
  imageUrl: null,
  status: "INSUFFICIENT",
  isSaved: false,
};

const dto = (over: Partial<SearchDto> = {}): SearchDto => ({
  query: "두유",
  appliedGoal: "WEIGHT_LOSS",
  exactMatches: { total: 2, items: [analyzed, insufficient] },
  similarProducts: { total: 0, items: [] },
  sameCategoryTop: [],
  analysisRequest: { available: false },
  ...over,
});

describe("toSearchResult", () => {
  it("항목의 등급 유무를 status로 나누고 isSaved를 saved로 바꾼다", () => {
    expect(toSearchResult(dto()).exactMatches.items).toEqual([
      {
        id: "7",
        name: "두유",
        brandName: "누티",
        imageUrl: null,
        saved: true,
        status: "ANALYZED",
        grade: "C",
        label: "보통이에요",
        highlight: "당류 21g — 체중 감량 기준 초과",
      },
      {
        id: "8",
        name: "과자",
        brandName: null,
        imageUrl: null,
        saved: false,
        status: "INSUFFICIENT",
      },
    ]);
  });

  it("감점이 없어 highlight가 빠지면 null이다", () => {
    const { highlight: _, ...noHighlight } = analyzed;
    void _;
    const item = toSearchResult(
      dto({ exactMatches: { total: 1, items: [noHighlight] } }),
    ).exactMatches.items[0];
    expect(item).toMatchObject({ status: "ANALYZED", highlight: null });
  });

  it("0건이면 폴백을 담고, 교정어가 없으면 null이다", () => {
    const result = toSearchResult(
      dto({
        exactMatches: { total: 0, items: [] },
        sameCategoryTop: [analyzed],
        analysisRequest: { available: true },
      }),
    );
    expect(result).toMatchObject({
      didYouMean: null,
      canRequestAnalysis: true,
    });
    expect(result.sameCategoryTop[0].id).toBe("7");
  });
});

describe("mergeSearchPages", () => {
  it("섹션 항목은 이어 붙이고 나머지는 첫 페이지 것을 쓴다", () => {
    const first = toSearchResult(
      dto({
        exactMatches: { total: 3, items: [analyzed] },
        similarProducts: { total: 2, items: [insufficient] },
        didYouMean: "두유",
      }),
    );
    const second = toSearchResult(
      dto({
        exactMatches: { total: 3, items: [{ ...analyzed, productId: 9 }] },
        similarProducts: { total: 2, items: [] },
      }),
    );
    const merged = mergeSearchPages([first, second]);
    expect(merged.exactMatches.items.map((item) => item.id)).toEqual([
      "7",
      "9",
    ]);
    expect(merged.similarProducts.items.map((item) => item.id)).toEqual(["8"]);
    expect(merged.exactMatches.total).toBe(3);
    expect(merged.didYouMean).toBe("두유");
  });
});

describe("toSearchSuggestion", () => {
  it("상품 제안은 ID를 문자열로, 검색어 제안은 이름과 구간만 담는다", () => {
    expect(
      toSearchSuggestion({
        type: "PRODUCT",
        productId: 7,
        name: "두유",
        matchedRanges: [[0, 2]],
      }),
    ).toEqual({
      type: "PRODUCT",
      productId: "7",
      brandName: null,
      name: "두유",
      matchedRanges: [[0, 2]],
    });
    expect(
      toSearchSuggestion({ type: "KEYWORD", name: "두유", matchedRanges: [] }),
    ).toEqual({ type: "KEYWORD", name: "두유", matchedRanges: [] });
  });
});
