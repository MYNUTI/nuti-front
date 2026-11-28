import { QueryClient, skipToken } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { toProductCard } from "@/lib/product/mapper";
import { searchKeys } from "@/lib/search/keys";
import { searchQueries, setSearchItemSaved } from "@/lib/search/queries";
import type { SearchResult } from "@/lib/search/types";
import { productCardDto } from "@/test/product";

const card = (productId: number, saved = false) =>
  toProductCard(productCardDto({ productId, saved }));

const page = (over: Partial<SearchResult> = {}): SearchResult => ({
  query: "두유",
  goal: "WEIGHT_LOSS",
  sort: "SCORE",
  sortLabel: "점수 높은 순",
  total: 0,
  hasNext: false,
  pinned: null,
  category: null,
  items: [],
  didYouMean: null,
  sameCategoryTop: [],
  canRequestAnalysis: false,
  ...over,
});

describe("searchQueries.result", () => {
  it("빈 검색어는 보내지 않는다", () => {
    expect(searchQueries.result("  ", "WEIGHT_LOSS").queryFn).toBe(skipToken);
    expect(searchQueries.result("두유", "WEIGHT_LOSS").queryFn).not.toBe(
      skipToken,
    );
  });

  it("앞뒤 공백만 다른 검색어는 같은 키를 쓰고, 목표·정렬마다 키가 다르다", () => {
    expect(searchQueries.result(" 두유 ", "WEIGHT_LOSS").queryKey).toEqual(
      searchKeys.result("두유", "WEIGHT_LOSS", "SCORE"),
    );
    expect(searchKeys.result("두유", "WEIGHT_LOSS")).not.toEqual(
      searchKeys.result("두유", "MUSCLE_GAIN"),
    );
    expect(searchKeys.result("두유", "WEIGHT_LOSS")).not.toEqual(
      searchKeys.result("두유", "WEIGHT_LOSS", "SUGAR_LOW"),
    );
  });

  it("0쪽부터 hasNext가 있을 때만 다음 페이지를 부른다", () => {
    const { getNextPageParam, initialPageParam } = searchQueries.result(
      "두유",
      "WEIGHT_LOSS",
    );
    expect(initialPageParam).toBe(0);
    expect(getNextPageParam(page({ hasNext: true }), [], 0, [0])).toBe(1);
    expect(
      getNextPageParam(page({ hasNext: false }), [], 1, [0, 1]),
    ).toBeUndefined();
  });
});

describe("searchQueries.suggestions", () => {
  it("trim한 길이가 2~30자일 때만 보낸다", () => {
    const sends = (q: string) =>
      searchQueries.suggestions(q).queryFn !== skipToken;
    expect(sends(" 두 ")).toBe(false);
    expect(sends("두유")).toBe(true);
    expect(sends("가".repeat(30))).toBe(true);
    expect(sends("가".repeat(31))).toBe(false);
    expect(searchQueries.suggestions(" 두유 ").queryKey).toEqual(
      searchKeys.suggestions("두유"),
    );
  });
});

describe("setSearchItemSaved", () => {
  it("목표·정렬이 다른 검색까지 pinned·목록·같은 종류 상위의 그 제품만 표시를 바꾼다", () => {
    const queryClient = new QueryClient();
    const keys = [
      searchKeys.result("두유", "WEIGHT_LOSS"),
      searchKeys.result("두유", "MUSCLE_GAIN", "PROTEIN_HIGH"),
    ];
    for (const key of keys)
      queryClient.setQueryData(key, {
        pages: [
          page({
            pinned: card(7),
            items: [card(7), card(8)],
            sameCategoryTop: [card(7)],
          }),
        ],
        pageParams: [0],
      });

    setSearchItemSaved(queryClient, "7", true);

    for (const key of keys) {
      const [first] = queryClient.getQueryData<{ pages: SearchResult[] }>(
        key,
      )!.pages;
      expect(first.pinned?.saved).toBe(true);
      expect(first.items.map((c) => [c.id, c.saved])).toEqual([
        ["7", true],
        ["8", false],
      ]);
      expect(first.sameCategoryTop[0].saved).toBe(true);
    }
  });
});
