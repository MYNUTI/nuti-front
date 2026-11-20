import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { describe, expect, it } from "vitest";
import { rankingKeys } from "@/lib/ranking/keys";
import {
  liveRanking,
  RANKING_PAGE_SIZE,
  rankingQueries,
  type RankingSource,
} from "@/lib/ranking/queries";
import type { RankedItemDto } from "@/lib/ranking/types";
import { mockAdapter, success } from "@/test/http";

function item(rank: number): RankedItemDto {
  return {
    rank,
    product: {
      productId: rank,
      name: `제품 ${rank}`,
      brandLine: "브랜드",
      imageUrl: null,
      state: "ANALYZED",
      stateLabel: "분석 완료",
      goals: [
        {
          goal: "WEIGHT_LOSS",
          score: 100 - rank,
          grade: "A",
          label: "잘 맞음",
        },
      ],
      tags: [],
      saved: false,
    },
  };
}

/** `total`개를 서버처럼 `page`·`size`로 잘라 주는 가짜 서버 */
function pagedSource(total: number) {
  const mock = mockAdapter((config) => {
    const page = Number(config.params.page);
    const size = Number(config.params.size);
    const start = page * size;
    const count = Math.max(0, Math.min(size, total - start));
    return success({
      category: {
        code: "0703",
        name: "닭가슴살",
        majorCode: "07",
        majorName: "고기·햄·달걀",
      },
      goal: "WEIGHT_LOSS",
      kcalBand: 2000,
      sort: config.params.sort ?? "SCORE",
      sortLabel: "점수 높은 순",
      coverage: { total, analyzed: total, updatedAt: null },
      total,
      page,
      size,
      hasNext: (page + 1) * size < total,
      items: Array.from({ length: count }, (_, i) => item(start + i + 1)),
    });
  });
  const source: RankingSource = {
    id: "sample",
    http: axios.create({ adapter: mock.adapter }),
  };
  return { source, requests: mock.requests };
}

describe("순위 무한 목록 쿼리", () => {
  it("다음 쪽이 없을 때까지 12개씩 이어 받고 한 목록으로 합친다", async () => {
    const { source, requests } = pagedSource(30);
    const options = rankingQueries.list({ category: "0703" }, source);

    // 넉넉히 5쪽을 달라고 해도 서버가 「다음 쪽 없음」을 준 3쪽에서 멈춘다
    const data = await new QueryClient().fetchInfiniteQuery({
      ...options,
      pages: 5,
    });

    expect(requests.map((request) => request.params)).toEqual([
      { category: "0703", page: 0, size: RANKING_PAGE_SIZE },
      { category: "0703", page: 1, size: RANKING_PAGE_SIZE },
      { category: "0703", page: 2, size: RANKING_PAGE_SIZE },
    ]);
    expect(data.pages.map((page) => page.items.length)).toEqual([12, 12, 6]);

    const merged = options.select?.(data);
    expect(merged?.items.map((product) => product.rank)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 1),
    );
    expect(merged).toMatchObject({ page: 2, hasNext: false, total: 30 });
  });

  it("다음 쪽 번호는 받은 쪽의 다음이고, 마지막 쪽이면 없다", () => {
    const options = rankingQueries.list({ category: "0703" }, liveRanking);
    const page = (pageNumber: number, hasNext: boolean) => ({
      category: {
        code: "0703",
        name: "닭가슴살",
        majorCode: "07",
        majorName: "고기·햄·달걀",
      },
      goal: "WEIGHT_LOSS" as const,
      sort: "SCORE" as const,
      sortLabel: "점수 높은 순",
      coverage: { total: 30, analyzed: 30, updatedAt: null },
      total: 30,
      page: pageNumber,
      hasNext,
      items: [],
    });
    const first = page(0, true);
    const last = page(2, false);
    expect(options.getNextPageParam(first, [first], 0, [0])).toBe(1);
    expect(options.getNextPageParam(last, [first, last], 2, [0, 2])).toBe(
      undefined,
    );
  });

  it("정렬·목표가 다르면 다른 키라 첫 쪽부터 다시 받고, 정렬 값은 요청에 실린다", async () => {
    const { source, requests } = pagedSource(5);
    const queryClient = new QueryClient();
    await queryClient.fetchInfiniteQuery(
      rankingQueries.list({ category: "0703" }, source),
    );
    await queryClient.fetchInfiniteQuery(
      rankingQueries.list({ category: "0703", sort: "PROTEIN_HIGH" }, source),
    );
    expect(requests.map((request) => request.params)).toEqual([
      { category: "0703", page: 0, size: RANKING_PAGE_SIZE },
      {
        category: "0703",
        sort: "PROTEIN_HIGH",
        page: 0,
        size: RANKING_PAGE_SIZE,
      },
    ]);
  });
});

describe("랭킹 쿼리 키", () => {
  it("실제 서버와 예시 자료는 키가 달라 캐시가 섞이지 않는다", () => {
    expect(rankingKeys.categories("live")).not.toEqual(
      rankingKeys.categories("sample"),
    );
    expect(rankingQueries.categories().queryKey).toEqual(
      rankingKeys.categories("live"),
    );
  });

  it("빈 필터와 필터 없음은 같은 키, 정렬·목표·필터가 다르면 다른 키", () => {
    const base = rankingKeys.list("live", { category: "0703" });
    expect(
      rankingKeys.list("live", {
        category: "0703",
        filters: { brands: [], nutrients: [], sellers: [] },
      }),
    ).toEqual(base);
    expect(
      rankingKeys.list("live", { category: "0703", sort: "SUGAR_LOW" }),
    ).not.toEqual(base);
    expect(
      rankingKeys.list("live", { category: "0703", goal: "MUSCLE_GAIN" }),
    ).not.toEqual(base);
    expect(
      rankingKeys.list("live", {
        category: "0703",
        filters: { sellers: ["COUPANG"] },
      }),
    ).not.toEqual(base);
    // 목록 키는 `lists` 아래라 한꺼번에 무효화할 수 있다
    expect(base.slice(0, 3)).toEqual(rankingKeys.lists("live"));
  });
});
