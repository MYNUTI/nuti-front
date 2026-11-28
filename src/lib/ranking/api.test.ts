import axios from "axios";
import { describe, expect, it } from "vitest";
import { ApiError, toApiError } from "@/lib/api/errors";
import {
  fetchRanking,
  fetchRankingBrands,
  fetchRankingCategories,
  fetchRankingFilters,
  fetchRankingLeaders,
  fetchRankingOverview,
} from "@/lib/ranking/api";
import { failure, mockAdapter, success, type Reply } from "@/test/http";

function client(reply: Reply) {
  const mock = mockAdapter(() => reply);
  const http = axios.create({ adapter: mock.adapter });
  http.interceptors.response.use(undefined, (error) =>
    Promise.reject(toApiError(error)),
  );
  return { http, ...mock };
}

const category = {
  code: "0703",
  name: "닭가슴살",
  majorCode: "07",
  majorName: "고기·햄·달걀",
};
const coverage = {
  total: 142,
  analyzed: 137,
  updatedAt: "2026-10-18T03:00:00",
};

const rankingDto = {
  category,
  goal: "WEIGHT_LOSS",
  kcalBand: 2000,
  sort: "SCORE",
  sortLabel: "점수 높은 순",
  coverage,
  total: 137,
  page: 0,
  size: 12,
  hasNext: true,
  items: [],
};

describe("랭킹 API", () => {
  it("분류는 열린 칩만 화면 모양으로 바꿔 돌려준다", async () => {
    const { http, requests } = client(
      success({
        majors: [
          {
            code: "07",
            name: "고기·햄·달걀",
            chips: [
              {
                code: "0703",
                name: "닭가슴살",
                aggregate: false,
                total: 142,
                analyzed: 137,
                open: true,
              },
              {
                code: "0701",
                name: "양념고기",
                aggregate: false,
                total: 40,
                analyzed: 12,
                open: false,
              },
            ],
          },
          { code: "03", name: "음료", chips: [] },
        ],
        updatedAt: "2026-10-18T03:00:00",
      }),
    );
    await expect(fetchRankingCategories(http)).resolves.toEqual({
      majors: [
        {
          code: "07",
          name: "고기·햄·달걀",
          chips: [{ code: "0703", name: "닭가슴살" }],
        },
        { code: "03", name: "음료", chips: [] },
      ],
      updatedAt: "2026-10-18T03:00:00",
    });
    expect(requests[0].url).toBe("/rankings/categories");
  });

  it("순위는 category·page·size를 보내고 goal·sort는 줄 때만 보낸다", async () => {
    const { http, requests } = client(success(rankingDto));
    await fetchRanking(http, { category: "0703", page: 0, size: 12 });
    await fetchRanking(http, {
      category: "0703",
      goal: "MUSCLE_GAIN",
      sort: "PROTEIN_HIGH",
      page: 1,
      size: 12,
    });
    expect(http.getUri(requests[0])).toBe(
      "/rankings?category=0703&page=0&size=12",
    );
    expect(http.getUri(requests[1])).toBe(
      "/rankings?category=0703&goal=MUSCLE_GAIN&sort=PROTEIN_HIGH&page=1&size=12",
    );
  });

  it("필터 배열은 같은 이름을 되풀이해 보내고 빈 배열은 보내지 않는다", async () => {
    const { http, requests } = client(success(rankingDto));
    await fetchRanking(http, {
      category: "0703",
      page: 0,
      size: 12,
      filters: {
        brands: ["하림", "제조 대상"],
        nutrients: [],
        sellers: ["COUPANG"],
      },
    });
    expect(http.getUri(requests[0])).toBe(
      "/rankings?category=0703&page=0&size=12" +
        `&brands=${encodeURIComponent("하림")}&brands=${encodeURIComponent("제조")}+${encodeURIComponent("대상")}` +
        "&sellers=COUPANG",
    );
  });

  it("쉼표가 든 브랜드 하나는 같은 이름을 두 번 보내 서버가 쉼표에서 나누지 않게 한다", async () => {
    const { http, requests } = client(success(rankingDto));
    await fetchRanking(http, {
      category: "0703",
      page: 0,
      size: 12,
      filters: { brands: ["A,B"] },
    });
    await fetchRanking(http, {
      category: "0703",
      page: 0,
      size: 12,
      filters: { brands: ["A,B", "C"] },
    });
    expect(requests[0].params.brands).toEqual(["A,B", "A,B"]);
    expect(http.getUri(requests[0])).toBe(
      "/rankings?category=0703&page=0&size=12&brands=A,B&brands=A,B",
    );
    // 값이 둘 이상이면 서버가 나누지 않으므로 그대로 보낸다
    expect(requests[1].params.brands).toEqual(["A,B", "C"]);
  });

  it("대분류 전체는 major를 보낸다", async () => {
    const { http, requests } = client(
      success({
        majorCode: "07",
        majorName: "고기·햄·달걀",
        goal: "WEIGHT_LOSS",
        kcalBand: 2000,
        groups: [{ category, coverage, items: [] }],
      }),
    );
    const overview = await fetchRankingOverview(http, {
      major: "07",
      filters: { sellers: ["COUPANG"] },
    });
    expect(http.getUri(requests[0])).toBe(
      "/rankings/overview?major=07&sellers=COUPANG",
    );
    expect(overview.groups).toEqual([{ category, coverage, items: [] }]);
  });

  it("첫 화면(leaders)은 목표 · 필터를 보내고 대분류 묶음을 화면 모양으로 돌려준다", async () => {
    const { http, requests } = client(
      success({
        goal: "MUSCLE_GAIN",
        kcalBand: 2000,
        updatedAt: "2026-10-18T03:00:00",
        groups: [{ majorCode: "07", majorName: "고기·햄·달걀", items: [] }],
      }),
    );
    const leaders = await fetchRankingLeaders(http, {
      goal: "MUSCLE_GAIN",
      filters: { nutrients: ["HIGH_PROTEIN"], brands: [] },
    });
    expect(http.getUri(requests[0])).toBe(
      "/rankings/leaders?goal=MUSCLE_GAIN&nutrients=HIGH_PROTEIN",
    );
    expect(leaders).toEqual({
      goal: "MUSCLE_GAIN",
      updatedAt: "2026-10-18T03:00:00",
      groups: [{ majorCode: "07", majorName: "고기·햄·달걀", items: [] }],
    });
  });

  it("필터 시트와 브랜드 더 보기 경로", async () => {
    const sheet = client(
      success({
        count: 137,
        nutrients: [],
        brands: { top: [], totalBrands: 0 },
        sellers: [],
      }),
    );
    await fetchRankingFilters(sheet.http, {
      category: "0703",
      filters: { nutrients: ["HIGH_PROTEIN", "LOW_FAT"] },
    });
    expect(sheet.http.getUri(sheet.requests[0])).toBe(
      "/rankings/filters?category=0703&nutrients=HIGH_PROTEIN&nutrients=LOW_FAT",
    );

    const brands = client(success({ total: 0, items: [] }));
    await fetchRankingBrands(brands.http, { category: "07", q: " 하림 " });
    await fetchRankingBrands(brands.http, { category: "07", q: "  " });
    expect(brands.http.getUri(brands.requests[0])).toBe(
      `/rankings/brands?category=07&q=${encodeURIComponent("하림")}`,
    );
    expect(brands.http.getUri(brands.requests[1])).toBe(
      "/rankings/brands?category=07",
    );
  });

  it("열리지 않은 칩(404)과 서버 오류(500)는 ApiError로 reject한다", async () => {
    const closed = client(failure(404, "RANKING_NOT_OPEN"));
    await expect(
      fetchRanking(closed.http, { category: "0701", page: 0, size: 12 }),
    ).rejects.toMatchObject({ status: 404, code: "RANKING_NOT_OPEN" });

    // 배포 서버가 제품 적재 전에 돌려주던 응답 모양(2026-11-20 확인)
    const broken = client(
      failure(500, "INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다."),
    );
    const error = await fetchRankingCategories(broken.http).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, code: "INTERNAL_SERVER_ERROR" });
  });
});
