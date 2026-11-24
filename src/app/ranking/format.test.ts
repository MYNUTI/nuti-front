import { describe, expect, it } from "vitest";

import {
  fixtureFilterSheet,
  fixtureOverview,
  fixtureRanking,
  FIXTURE_MAJORS,
} from "./_fixtures";
import {
  formatCoverage,
  formatUpdatedDate,
  parseRankingGoal,
  brandChipLabel,
  parseRankingBrands,
  parseRankingSellers,
  parseRankingShown,
  parseRankingSort,
  rankingHref,
  sellerChipLabel,
} from "./format";

// `review/v3-rankings`의 `src/lib/ranking/format.test.ts`를 옮겼다(목표 값은 fixture 미리 보기 기준)
describe("랭킹 화면 글자", () => {
  it("날짜는 글자에서 월·일만 읽는다", () => {
    expect(formatUpdatedDate("2026-10-18T03:00:00")).toBe("10월 18일");
    // 자정 직전이어도 보는 기기의 시간대와 상관없이 같은 날짜
    expect(formatUpdatedDate("2026-01-05T23:59:59")).toBe("1월 5일");
    expect(formatUpdatedDate(null)).toBeNull();
    expect(formatUpdatedDate("어제")).toBeNull();
  });

  it("개수 줄: 점수 없는 제품이 있으면 「n개 중 m개 점수 있음」, 모두 있으면 「n개」", () => {
    expect(
      formatCoverage({
        total: 52,
        analyzed: 48,
        updatedAt: "2026-10-18T03:00:00",
      }),
    ).toBe("52개 중 48개 점수 있음, 10월 18일 업데이트");
    expect(
      formatCoverage({
        total: 1420,
        analyzed: 1420,
        updatedAt: "2026-10-18T03:00:00",
      }),
    ).toBe("1,420개, 10월 18일 업데이트");
    expect(formatCoverage({ total: 52, analyzed: 48, updatedAt: null })).toBe(
      "52개 중 48개 점수 있음",
    );
  });

  it("주소의 정렬 값: 시트에 없는 값(숨긴 인기순 포함)은 기본 정렬", () => {
    expect(parseRankingSort("PROTEIN_HIGH")).toBe("PROTEIN_HIGH");
    expect(parseRankingSort("POPULAR")).toBe("SCORE");
    expect(parseRankingSort(undefined)).toBe("SCORE");
    expect(parseRankingSort(["SUGAR_LOW"])).toBe("SCORE");
  });

  it("주소의 목표 값: muscle만 근육 증가, 그 밖은 다이어트", () => {
    expect(parseRankingGoal("muscle")).toBe("MUSCLE_GAIN");
    expect(parseRankingGoal("diet")).toBe("WEIGHT_LOSS");
    expect(parseRankingGoal(undefined)).toBe("WEIGHT_LOSS");
  });
});

describe("랭킹 fixture", () => {
  it("정렬마다 순서와 순위를 다시 매기고, 영양소 정렬이면 그 값 글을 단다", () => {
    const score = fixtureRanking("01S4", "SCORE").items;
    expect(score.map((p) => p.rank)).toEqual(score.map((_, i) => i + 1));
    expect(score[0].sortText).toBeNull();
    const protein = fixtureRanking("01S4", "PROTEIN_HIGH").items;
    expect(protein[0].sortText).toBe("100g당 단백질 37.7g");
  });

  it("대분류 묶음은 제품이 있는 칩마다 위에서 count개, 없는 칩은 뺀다", () => {
    const groups = fixtureOverview(FIXTURE_MAJORS[0], 3);
    expect(groups.map((g) => g.chip.name)).not.toContain("단백질 파우더");
    expect(groups.map((g) => g.chip.code)).toEqual(
      FIXTURE_MAJORS[0].chips
        .map((c) => c.code)
        .filter((code) => groups.some((g) => g.chip.code === code)),
    );
    for (const g of groups) {
      expect(g.items.length).toBeLessThanOrEqual(3);
      expect(g.items.map((p) => p.rank)).toEqual(g.items.map((_, i) => i + 1));
    }
  });

  it("불러온 개수는 12의 배수로 읽고 틀린 값은 12", () => {
    expect(parseRankingShown("24")).toBe(24);
    expect(parseRankingShown("30")).toBe(36);
    expect(parseRankingShown("12")).toBe(12);
    expect(parseRankingShown("-24")).toBe(12);
    expect(parseRankingShown("abc")).toBe(12);
    expect(parseRankingShown(undefined)).toBe(12);
  });

  it("순위 주소는 기본 정렬 · 다이어트 목표를 적지 않는다", () => {
    expect(rankingHref("01S4", { sort: "SCORE", goal: "WEIGHT_LOSS" })).toBe(
      "/ranking/01S4",
    );
    expect(
      rankingHref("01", { sort: "PROTEIN_HIGH", goal: "MUSCLE_GAIN" }),
    ).toBe("/ranking/01?sort=PROTEIN_HIGH&goal=muscle");
  });

  it("판매처는 아는 값만 시트 순서로 읽고, 칩 글자는 하나면 이름 · 여럿이면 「외 n」", () => {
    expect(parseRankingSellers(["GS25", "CU", "LOTTE"])).toEqual([
      "CU",
      "GS25",
    ]);
    expect(parseRankingSellers("COUPANG")).toEqual(["COUPANG"]);
    expect(parseRankingSellers(undefined)).toEqual([]);
    expect(sellerChipLabel([])).toBe("판매처");
    expect(sellerChipLabel(["CU"])).toBe("CU");
    expect(sellerChipLabel(["COUPANG", "CU", "GS25"])).toBe("쿠팡 외 2");
  });

  it("순위 주소에 판매처를 여러 번 적고, 필터를 걸면 그 안에서 순위를 다시 매긴다", () => {
    expect(
      rankingHref("01S4", {
        sort: "SCORE",
        goal: "WEIGHT_LOSS",
        filters: { sellers: ["CU", "GS25"], brands: [] },
      }),
    ).toBe("/ranking/01S4?seller=CU&seller=GS25");

    const cu = fixtureRanking("01S4", "SCORE", {
      sellers: ["CU"],
      brands: [],
    });
    expect(cu.items).toHaveLength(4);
    expect(cu.items.map((p) => p.rank)).toEqual([1, 2, 3, 4]);
    expect(cu.coverage.total).toBe(4);

    const sheet = fixtureFilterSheet("01S4", {
      sellers: ["CU"],
      brands: [],
    });
    expect(sheet.count).toBe(4);
    expect(sheet.sellers.CU).toBe(4);
    expect(sheet.sellers.COUPANG).toBe(
      fixtureRanking("01S4", "SCORE").items.length,
    );
  });

  it("브랜드는 빈 값 · 겹친 값을 버리고, 칩 글자는 1곳이면 이름(8자 넘으면 말줄임) · 2곳 이상이면 「브랜드 n」", () => {
    expect(
      parseRankingBrands(["마이프로틴", " 칼만스 ", "", "마이프로틴"]),
    ).toEqual(["마이프로틴", "칼만스"]);
    expect(parseRankingBrands(undefined)).toEqual([]);
    expect(brandChipLabel([])).toBe("브랜드");
    expect(brandChipLabel(["마이프로틴"])).toBe("마이프로틴");
    expect(brandChipLabel(["커클랜드 시그니처"])).toBe("커클랜드 시그니…");
    expect(brandChipLabel(["마이프로틴", "칼만스"])).toBe("브랜드 2");
  });

  it("브랜드 탭은 제품 수 순 8개까지, 「제조 ○○」는 빼고 전체 수에만 센다. 탭끼리는 AND", () => {
    const sheet = fixtureFilterSheet("01S4", { sellers: [], brands: [] });
    expect(sheet.brands.top).toHaveLength(8);
    expect(sheet.brands.top[0]).toEqual({ name: "마이프로틴", count: 3 });
    expect(sheet.brands.top.some((b) => b.name.startsWith("제조 "))).toBe(
      false,
    );
    expect(sheet.brands.counts["제조 씨알푸드"]).toBe(1);
    expect(sheet.brands.totalBrands).toBeGreaterThan(8);

    const both = { sellers: ["CU" as const], brands: ["마이프로틴"] };
    expect(fixtureRanking("01S4", "SCORE", both).items).toHaveLength(1);
    // 판매처 수는 브랜드 조건만, 브랜드 수는 판매처 조건만 걸고 센다
    const counted = fixtureFilterSheet("01S4", both);
    expect(counted.sellers.COUPANG).toBe(3);
    expect(counted.brands.counts["마이프로틴"]).toBe(1);
    expect(
      rankingHref("01S4", {
        sort: "SCORE",
        goal: "WEIGHT_LOSS",
        filters: both,
      }),
    ).toBe(
      "/ranking/01S4?seller=CU&brand=%EB%A7%88%EC%9D%B4%ED%94%84%EB%A1%9C%ED%8B%B4",
    );
  });
});
