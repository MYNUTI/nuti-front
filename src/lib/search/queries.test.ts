import { QueryClient, skipToken } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { searchKeys } from "@/lib/search/keys";
import { searchQueries, setSearchItemSaved } from "@/lib/search/queries";
import type { SearchItem, SearchResult } from "@/lib/search/types";

const item = (id: string, saved = false): SearchItem => ({
  id,
  name: id,
  brandName: null,
  imageUrl: null,
  saved,
  status: "INSUFFICIENT",
});

const page = (over: Partial<SearchResult> = {}): SearchResult => ({
  query: "두유",
  appliedGoal: "GENERAL",
  exactMatches: { total: 0, items: [] },
  similarProducts: { total: 0, items: [] },
  didYouMean: null,
  sameCategoryTop: [],
  canRequestAnalysis: false,
  ...over,
});

describe("searchQueries.result", () => {
  it("빈 검색어는 보내지 않는다", () => {
    expect(searchQueries.result("  ").queryFn).toBe(skipToken);
    expect(searchQueries.result("두유").queryFn).not.toBe(skipToken);
  });

  it("앞뒤 공백만 다른 검색어는 같은 키를 쓴다", () => {
    expect(searchQueries.result(" 두유 ").queryKey).toEqual(
      searchKeys.result("두유"),
    );
  });

  it("두 섹션 중 하나라도 남았으면 다음 페이지가 있다", () => {
    const { getNextPageParam } = searchQueries.result("두유");
    const totals = (exact: number, similar: number) =>
      page({
        exactMatches: { total: exact, items: [] },
        similarProducts: { total: similar, items: [] },
      });
    expect(getNextPageParam(totals(20, 21), [], 0, [0])).toBe(1);
    expect(getNextPageParam(totals(40, 5), [], 0, [0])).toBe(1);
    expect(getNextPageParam(totals(20, 20), [], 0, [0])).toBeUndefined();
    expect(getNextPageParam(totals(40, 0), [], 1, [0, 1])).toBeUndefined();
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
  it("캐시된 모든 검색 결과에서 그 상품의 저장 표시만 바꾼다", () => {
    const queryClient = new QueryClient();
    const keys = [
      searchKeys.result("두유"),
      searchKeys.result("우유", "WEIGHT_LOSS"),
    ];
    for (const key of keys)
      queryClient.setQueryData(key, {
        pages: [
          page({ exactMatches: { total: 2, items: [item("7"), item("8")] } }),
          page({ similarProducts: { total: 1, items: [item("7")] } }),
          page({ sameCategoryTop: [item("7")] }),
        ],
        pageParams: [0, 1, 2],
      });

    setSearchItemSaved(queryClient, "7", true);

    for (const key of keys) {
      const data = queryClient.getQueryData<{ pages: SearchResult[] }>(key)!;
      expect(data.pages[0].exactMatches.items.map((i) => i.saved)).toEqual([
        true,
        false,
      ]);
      expect(data.pages[1].similarProducts.items[0].saved).toBe(true);
      expect(data.pages[2].sameCategoryTop[0].saved).toBe(true);
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }
  });
});
