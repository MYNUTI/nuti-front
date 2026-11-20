import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import {
  fetchRanking,
  fetchRankingBrands,
  fetchRankingCategories,
  fetchRankingFilters,
  fetchRankingOverview,
} from "@/lib/ranking/api";
import { rankingKeys } from "@/lib/ranking/keys";
import { RANKING_PAGE_SIZE, rankingQueries } from "@/lib/ranking/queries";

import { sampleRanking } from "./sample-http";

const { http } = sampleRanking;

// 예시 자료가 실제 API 함수·mapper·쿼리 옵션을 그대로 타는지 본다
describe("예시 자료 연결부", () => {
  it("분류: 대분류 15개와 열린 칩", async () => {
    const categories = await fetchRankingCategories(http);
    expect(categories.majors).toHaveLength(15);
    expect(categories.majors[0]).toMatchObject({
      code: "01",
      name: "다이어트·단백질",
    });
    expect(categories.majors[0].chips.map((chip) => chip.name)).toEqual([
      "샐러드",
      "닭가슴살",
      "두부·곤약",
      "단백질 파우더",
      "프로틴바·간식",
      "단백질 음료",
    ]);
    expect(categories.majors[2].chips).toEqual([]);
  });

  it("순위: 점수 높은 순, 순번, 개수 줄 값", async () => {
    const page = await fetchRanking(http, {
      category: "01S4",
      page: 0,
      size: RANKING_PAGE_SIZE,
    });
    expect(page.items.map((item) => item.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(page.items[0]).toMatchObject({
      name: "하이프로틴바 초콜렛 오렌지",
      score: { value: 96, band: 1 },
      tags: [
        { label: "단백질 많음", warn: false },
        { label: "포화지방 많음", warn: true },
      ],
      sortText: null,
    });
    expect(page).toMatchObject({
      goal: "WEIGHT_LOSS",
      sort: "SCORE",
      total: 12,
      hasNext: false,
      coverage: { total: 13, analyzed: 12 },
      category: { name: "프로틴바·간식", majorName: "다이어트·단백질" },
    });
  });

  it("단백질 많은 순: 값이 있는 제품을 값 큰 순으로, 없는 제품은 뒤에 점수 순서 그대로", async () => {
    const page = await fetchRanking(http, {
      category: "01S4",
      sort: "PROTEIN_HIGH",
      page: 0,
      size: RANKING_PAGE_SIZE,
    });
    expect(page.items.slice(0, 5).map((item) => item.sortText)).toEqual([
      "100g당 단백질 37.7g",
      "100g당 단백질 35g",
      "100g당 단백질 33.3g",
      "100g당 단백질 32g",
      "100g당 단백질 25g",
    ]);
    expect(page.items[0]).toMatchObject({ rank: 1, brand: "미트리" });
    expect(page.items[5]).toMatchObject({
      rank: 6,
      brand: "오리온",
      sortText: null,
    });
  });

  it("쪽 나누기: 쪽 크기만큼 자르고 다음 쪽 여부를 준다", async () => {
    const first = await fetchRanking(http, {
      category: "01S4",
      page: 0,
      size: 5,
    });
    const last = await fetchRanking(http, {
      category: "01S4",
      page: 2,
      size: 5,
    });
    expect(first).toMatchObject({ page: 0, hasNext: true });
    expect(first.items).toHaveLength(5);
    expect(last).toMatchObject({ page: 2, hasNext: false });
    expect(last.items.map((item) => item.rank)).toEqual([11, 12]);
  });

  it("대분류 전체: 제품이 있는 칩만, 열린 칩이 없으면 빈 묶음", async () => {
    const diet = await fetchRankingOverview(http, { major: "01" });
    expect(diet.groups.map((group) => group.category.name)).toEqual([
      "샐러드",
      "닭가슴살",
      "두부·곤약",
      "프로틴바·간식",
    ]);
    expect(diet.groups[3].items).toHaveLength(3);

    const drinks = await fetchRankingOverview(http, { major: "03" });
    expect(drinks.groups).toEqual([]);
  });

  it("없는 분류는 404, 잘못된 쪽 크기는 400", async () => {
    await expect(
      fetchRanking(http, { category: "9999", page: 0, size: 12 }),
    ).rejects.toMatchObject({ status: 404, code: "RESOURCE_NOT_FOUND" });
    await expect(
      fetchRanking(http, { category: "01S4", page: 0, size: 51 }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_QUERY_PARAM" });
    await expect(
      fetchRankingOverview(http, { major: "99" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("필터 시트와 브랜드 더 보기", async () => {
    const sheet = await fetchRankingFilters(http, { category: "01S4" });
    expect(sheet.count).toBe(12);
    expect(sheet.brands.top[0]).toEqual({ name: "마이프로틴", count: 3 });
    expect(sheet.sellers.map((seller) => seller.code)).toContain("COUPANG");

    const brands = await fetchRankingBrands(http, {
      category: "01S4",
      q: "닥터",
    });
    expect(brands).toEqual({
      total: 1,
      items: [{ name: "닥터유", count: 2 }],
    });
  });

  // 예시는 12개라 한 쪽에서 끝난다. 여러 쪽을 이어 받는 것은 `lib/ranking/queries.test.ts`가 본다
  it("쿼리 옵션: 예시 자료 키로 받고 다음 쪽이 없다", async () => {
    const queryClient = new QueryClient();
    const options = rankingQueries.list({ category: "01S4" }, sampleRanking);
    expect(options.queryKey).toEqual(
      rankingKeys.list("sample", { category: "01S4" }),
    );

    const data = await queryClient.fetchInfiniteQuery(options);
    expect(data.pages).toHaveLength(1);
    expect(options.getNextPageParam?.(data.pages[0], data.pages, 0, [0])).toBe(
      undefined,
    );
    expect(options.select?.(data).items).toHaveLength(12);
  });
});
