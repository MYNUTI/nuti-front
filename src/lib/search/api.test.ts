import axios from "axios";
import { describe, expect, it } from "vitest";
import {
  fetchPopularKeywords,
  fetchSearch,
  fetchSearchSuggestions,
} from "@/lib/search/api";
import { mockAdapter, success } from "@/test/http";

function client(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

describe("검색 API", () => {
  it("검색은 q·page·size를 보내고 goal은 줄 때만 보낸다", async () => {
    const empty = { total: 0, items: [] };
    const { http, requests } = client({
      query: "두유",
      appliedGoal: "GENERAL",
      exactMatches: empty,
      similarProducts: empty,
      sameCategoryTop: [],
      analysisRequest: { available: true },
    });
    await fetchSearch(http, { q: "두유", page: 0, size: 20 });
    await fetchSearch(http, {
      q: "두유",
      goal: "WEIGHT_LOSS",
      page: 1,
      size: 20,
    });
    expect(http.getUri(requests[0])).toBe(
      "/search?q=%EB%91%90%EC%9C%A0&page=0&size=20",
    );
    expect(http.getUri(requests[1])).toBe(
      "/search?q=%EB%91%90%EC%9C%A0&goal=WEIGHT_LOSS&page=1&size=20",
    );
  });

  it("자동완성과 인기 검색어 경로", async () => {
    const { http, requests } = client({ items: [] });
    await fetchSearchSuggestions(http, "두");
    expect(http.getUri(requests[0])).toBe("/search/suggestions?q=%EB%91%90");

    const popular = client([{ rank: 1, keyword: "두유" }]);
    await expect(fetchPopularKeywords(popular.http)).resolves.toEqual([
      { rank: 1, keyword: "두유" },
    ]);
    expect(popular.requests[0].url).toBe("/search/keywords/popular");
  });
});
