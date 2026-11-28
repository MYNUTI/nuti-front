import { describe, expect, it } from "vitest";
import {
  mergeSearchPages,
  toSearchResult,
  toSearchSuggestion,
} from "@/lib/search/mapper";
import type { SearchDto } from "@/lib/search/types";
import { productCardDto } from "@/test/product";

const dto = (over: Partial<SearchDto> = {}): SearchDto => ({
  query: "두유",
  goal: "WEIGHT_LOSS",
  kcalBand: 2000,
  sort: "SCORE",
  sortLabel: "점수 높은 순",
  total: 1,
  page: 0,
  size: 20,
  hasNext: false,
  items: [productCardDto()],
  sameCategoryTop: [],
  analysisRequestAvailable: false,
  ...over,
});

describe("toSearchResult", () => {
  it("한 목록의 카드를 바꾸고, 빠진 pinned·category·didYouMean은 null이다", () => {
    expect(toSearchResult(dto())).toMatchObject({
      query: "두유",
      goal: "WEIGHT_LOSS",
      sort: "SCORE",
      total: 1,
      hasNext: false,
      pinned: null,
      category: null,
      items: [{ id: "7" }],
      didYouMean: null,
      sameCategoryTop: [],
      canRequestAnalysis: false,
    });
  });

  it("이름이 같은 제품(pinned)과 종류 순위 링크를 담는다", () => {
    expect(
      toSearchResult(
        dto({
          pinned: productCardDto({ productId: 9 }),
          category: { code: "0101", name: "두유" },
        }),
      ),
    ).toMatchObject({
      pinned: { id: "9" },
      category: { code: "0101", name: "두유" },
    });
  });

  it("0건이면 교정어·같은 종류 상위·분석 요청을 담는다", () => {
    expect(
      toSearchResult(
        dto({
          total: 0,
          items: [],
          didYouMean: "두유",
          sameCategoryTop: [productCardDto({ productId: 8 })],
          analysisRequestAvailable: true,
        }),
      ),
    ).toMatchObject({
      didYouMean: "두유",
      sameCategoryTop: [{ id: "8" }],
      canRequestAnalysis: true,
    });
  });
});

describe("mergeSearchPages", () => {
  it("항목은 이어 붙이고 pinned·질의 정보는 첫 페이지, 다음 페이지 여부는 마지막 페이지 것을 쓴다", () => {
    const first = toSearchResult(
      dto({
        total: 3,
        hasNext: true,
        pinned: productCardDto({ productId: 9 }),
      }),
    );
    const second = toSearchResult(
      dto({
        total: 3,
        page: 1,
        hasNext: false,
        items: [productCardDto({ productId: 8 })],
      }),
    );
    expect(mergeSearchPages([first, second])).toMatchObject({
      total: 3,
      hasNext: false,
      pinned: { id: "9" },
      items: [{ id: "7" }, { id: "8" }],
    });
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
