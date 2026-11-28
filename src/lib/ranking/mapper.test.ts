import { describe, expect, it } from "vitest";
import type { ProductCardDto } from "@/lib/product/types";
import {
  mergeRankingPages,
  toRankingLeaders,
  toRankingOverview,
  toRankingPage,
  toSortText,
} from "@/lib/ranking/mapper";
import type { RankingDto, RankingPage } from "@/lib/ranking/types";

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

function card(overrides: Partial<ProductCardDto> = {}): ProductCardDto {
  return {
    productId: 31,
    name: "닭가슴바블랙페퍼80g",
    brandLine: "하림",
    imageUrl: "https://example.com/31.jpg",
    state: "ANALYZED",
    stateLabel: "분석 완료",
    goals: [
      { goal: "WEIGHT_LOSS", score: 74.3, grade: "B", label: "맞는 편" },
      { goal: "MUSCLE_GAIN", score: 91.5, grade: "A", label: "잘 맞음" },
    ],
    tags: ["단백질 많음", "나트륨 많음"],
    saved: false,
    ...overrides,
  };
}

function rankingDto(overrides: Partial<RankingDto> = {}): RankingDto {
  return {
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
    items: [{ rank: 1, product: card() }],
    ...overrides,
  };
}

describe("순위 응답 → 화면 모양", () => {
  it("요청한 목표의 점수와 등급으로 점수 구간을 정한다", () => {
    expect(toRankingPage(rankingDto()).items[0]).toEqual({
      id: "31",
      rank: 1,
      name: "닭가슴바블랙페퍼80g",
      brand: "하림",
      imageUrl: "https://example.com/31.jpg",
      score: { value: 74.3, band: 2 },
      tags: [
        { label: "단백질 많음", warn: false },
        { label: "나트륨 많음", warn: false },
      ],
      sortText: null,
    });

    const muscle = toRankingPage(rankingDto({ goal: "MUSCLE_GAIN" }));
    expect(muscle.items[0].score).toEqual({ value: 91.5, band: 1 });
  });

  it("그 목표의 점수가 없으면 점수 없이, 브랜드·사진이 비면 null로 둔다", () => {
    const page = toRankingPage(
      rankingDto({
        items: [
          {
            rank: 1,
            product: card({ goals: [], brandLine: " ", imageUrl: "" }),
          },
        ],
      }),
    );
    expect(page.items[0]).toMatchObject({
      score: null,
      brand: null,
      imageUrl: null,
    });
  });

  it("태그는 서버 순서 그대로, 좋고 나쁨 구분이 없어 모두 같은 색이다", () => {
    const page = toRankingPage(
      rankingDto({
        items: [
          {
            rank: 1,
            product: card({ tags: ["포화지방 많음", "단백질 많음"] }),
          },
        ],
      }),
    );
    expect(page.items[0].tags).toEqual([
      { label: "포화지방 많음", warn: false },
      { label: "단백질 많음", warn: false },
    ]);
  });

  it("영양소 정렬 값은 디자인 순서(100g당 단백질 37.7g)로 짓는다", () => {
    const sortValue = {
      nutrient: "PROTEIN",
      value: 37.7,
      unit: "g",
      basis: "100g",
      text: "단백질 37.7g · 100g당",
    } as const;
    expect(toSortText(sortValue)).toBe("100g당 단백질 37.7g");
    expect(
      toSortText({ ...sortValue, value: 35, text: "단백질 35g · 100g당" }),
    ).toBe("100g당 단백질 35g");
    expect(
      toSortText({
        nutrient: "CALORIES",
        value: 42.04,
        unit: "kcal",
        basis: "100mL",
        text: "칼로리 42kcal · 100mL당",
      }),
    ).toBe("100mL당 칼로리 42kcal");

    const page = toRankingPage(
      rankingDto({
        sort: "PROTEIN_HIGH",
        items: [{ rank: 1, product: card({ sortValue }) }],
      }),
    );
    expect(page.items[0].sortText).toBe("100g당 단백질 37.7g");
  });

  it("대분류 전체도 같은 카드 규칙을 쓴다", () => {
    const overview = toRankingOverview({
      majorCode: "07",
      majorName: "고기·햄·달걀",
      goal: "MUSCLE_GAIN",
      kcalBand: 2600,
      groups: [{ category, coverage, items: [{ rank: 1, product: card() }] }],
    });
    expect(overview.groups[0].items[0]).toMatchObject({
      id: "31",
      score: { value: 91.5, band: 1 },
    });
  });
});

describe("무한 목록 합치기", () => {
  it("항목은 이어 붙이고 다음 쪽 여부는 마지막 쪽 것을 쓴다", () => {
    const first = toRankingPage(rankingDto());
    const second: RankingPage = {
      ...toRankingPage(
        rankingDto({
          page: 1,
          hasNext: false,
          items: [{ rank: 13, product: card({ productId: 44 }) }],
        }),
      ),
    };
    const merged = mergeRankingPages([first, second]);
    expect(merged.items.map((item) => item.rank)).toEqual([1, 13]);
    expect(merged).toMatchObject({ page: 1, hasNext: false, total: 137 });
    expect(mergeRankingPages([first])).toEqual(first);
  });
});

describe("toRankingLeaders", () => {
  it("대분류 묶음 순서를 지키고, 줄마다 중분류와 그 1위 제품을 담는다", () => {
    const leaders = toRankingLeaders({
      goal: "MUSCLE_GAIN",
      kcalBand: 2000,
      updatedAt: "2026-10-18T03:00:00",
      groups: [
        {
          majorCode: "07",
          majorName: "고기·햄·달걀",
          items: [
            {
              category,
              product: card({
                goals: [
                  { goal: "WEIGHT_LOSS", score: 50, grade: "C", label: "보통" },
                  {
                    goal: "MUSCLE_GAIN",
                    score: 91.5,
                    grade: "A",
                    label: "잘 맞음",
                  },
                ],
              }),
            },
          ],
        },
      ],
    });
    expect(leaders).toMatchObject({
      goal: "MUSCLE_GAIN",
      updatedAt: "2026-10-18T03:00:00",
      groups: [
        {
          majorCode: "07",
          majorName: "고기·햄·달걀",
          items: [
            {
              category: { code: "0703", name: "닭가슴살" },
              product: { rank: 1, score: { value: 91.5, band: 1 } },
            },
          ],
        },
      ],
    });
  });

  it("기준 시각이 없으면 null", () => {
    expect(
      toRankingLeaders({
        goal: "WEIGHT_LOSS",
        kcalBand: 2000,
        updatedAt: null,
        groups: [],
      }).updatedAt,
    ).toBeNull();
  });
});
