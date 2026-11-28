import { describe, expect, it } from "vitest";

import {
  fixtureBrandList,
  fixtureFilterSheet,
  fixtureOverview,
  fixtureRanking,
  FIXTURE_MAJORS,
} from "./_fixtures";
import {
  formatCoverage,
  formatUpdatedDate,
  brandChipLabel,
  brandIndexLetter,
  filterSummary,
  groupBrandsByLetter,
  MAJOR_ICON,
  nutrientChipLabel,
  parseRankingBrands,
  parseRankingNutrients,
  parseRankingSellers,
  parseRankingShown,
  parseRankingSort,
  rankingHref,
  sellerChipLabel,
  writeFilterParams,
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

  it("순위 주소는 기본 정렬을 적지 않고, 목표는 기기에 있어 적지 않는다", () => {
    expect(rankingHref("01S4", { sort: "SCORE" })).toBe("/ranking/01S4");
    expect(rankingHref("01", { sort: "PROTEIN_HIGH" })).toBe(
      "/ranking/01?sort=PROTEIN_HIGH",
    );
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
        filters: { sellers: ["CU", "GS25"], brands: [], nutrients: [] },
      }),
    ).toBe("/ranking/01S4?seller=CU&seller=GS25");

    const cu = fixtureRanking("01S4", "SCORE", {
      sellers: ["CU"],
      brands: [],
      nutrients: [],
    });
    expect(cu.items).toHaveLength(4);
    expect(cu.items.map((p) => p.rank)).toEqual([1, 2, 3, 4]);
    expect(cu.coverage.total).toBe(4);

    const sheet = fixtureFilterSheet("01S4", {
      sellers: ["CU"],
      brands: [],
      nutrients: [],
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
    const sheet = fixtureFilterSheet("01S4", {
      sellers: [],
      brands: [],
      nutrients: [],
    });
    expect(sheet.brands.top).toHaveLength(8);
    expect(sheet.brands.top[0]).toEqual({ name: "마이프로틴", count: 3 });
    expect(sheet.brands.top.some((b) => b.name.startsWith("제조 "))).toBe(
      false,
    );
    expect(sheet.brands.counts["제조 씨알푸드"]).toBe(1);
    expect(sheet.brands.totalBrands).toBeGreaterThan(8);

    const both = {
      sellers: ["CU" as const],
      brands: ["마이프로틴"],
      nutrients: [],
    };
    expect(fixtureRanking("01S4", "SCORE", both).items).toHaveLength(1);
    // 서버처럼 탭마다의 수는 고른 조건 없이 센다. 「n개 제품 보기」만 고른 조건으로
    const counted = fixtureFilterSheet("01S4", both);
    expect(counted.sellers.COUPANG).toBe(
      fixtureRanking("01S4", "SCORE").items.length,
    );
    expect(counted.brands.counts["마이프로틴"]).toBe(3);
    expect(counted.count).toBe(1);
    expect(
      rankingHref("01S4", {
        sort: "SCORE",
        filters: both,
      }),
    ).toBe(
      "/ranking/01S4?seller=CU&brand=%EB%A7%88%EC%9D%B4%ED%94%84%EB%A1%9C%ED%8B%B4",
    );
  });

  it("2-5e 가나다 머리: 초성(겹자음은 홑자음) · 영문은 A–Z · 그 밖은 #, 머리 안은 가나다순", () => {
    expect(brandIndexLetter("마이프로틴")).toBe("ㅁ");
    expect(brandIndexLetter("쌀과자")).toBe("ㅅ");
    expect(brandIndexLetter("Dr.You")).toBe("A–Z");
    expect(brandIndexLetter("365일")).toBe("#");
    const groups = groupBrandsByLetter(
      [
        "칼만스",
        "Dr.You",
        "미트리",
        "마이프로틴",
        "커클랜드 시그니처",
        "농심",
        "365일",
      ].map((name) => ({ name })),
    );
    expect(groups.map((g) => g.letter)).toEqual(["ㄴ", "ㅁ", "ㅋ", "A–Z", "#"]);
    expect(groupBrandsByLetter([])).toEqual([]);
    expect(groups[1].brands.map((b) => b.name)).toEqual([
      "마이프로틴",
      "미트리",
    ]);
    expect(groups[2].brands.map((b) => b.name)).toEqual([
      "칼만스",
      "커클랜드 시그니처",
    ]);
  });

  it("2-5e 목록은 판매처와 상관없이 그 종류의 전체 브랜드(「제조 ○○」 포함)", () => {
    const list = fixtureBrandList("01S4");
    expect(list.map((b) => b.name)).toContain("제조 씨알푸드");
    expect(list.find((b) => b.name === "마이프로틴")?.count).toBe(3);
    expect(list).toHaveLength(
      fixtureFilterSheet("01S4", { sellers: [], brands: [], nutrients: [] })
        .brands.totalBrands,
    );
  });

  it("영양성분은 아는 값만 칩 순서로 읽고, 칩 글자는 1개면 이름 · 2개 이상이면 「영양성분 n」", () => {
    expect(
      parseRankingNutrients(["HIGH_PROTEIN", "LOW_SUGAR", "SALTY"]),
    ).toEqual(["LOW_SUGAR", "HIGH_PROTEIN"]);
    expect(nutrientChipLabel([])).toBe("영양성분");
    expect(nutrientChipLabel(["HIGH_PROTEIN"])).toBe("고단백");
    expect(nutrientChipLabel(["LOW_SUGAR", "HIGH_PROTEIN"])).toBe("영양성분 2");
  });

  it("영양성분 칩은 탭 안 OR · 다른 탭과 AND로 거르고, 칩 수는 다른 조건 없이 센다(서버처럼)", () => {
    const none = { sellers: [], brands: [], nutrients: [] };
    const lowSugar = fixtureRanking("01S4", "SCORE", {
      ...none,
      nutrients: ["LOW_SUGAR"],
    }).items;
    expect(lowSugar.length).toBe(4);
    expect(
      fixtureRanking("01S4", "SCORE", {
        ...none,
        nutrients: ["LOW_SUGAR", "HIGH_PROTEIN"],
      }).items.length,
    ).toBe(fixtureRanking("01S4", "SCORE").items.length);
    expect(
      fixtureRanking("01S4", "SCORE", {
        ...none,
        sellers: ["KURLY"],
        nutrients: ["LOW_SUGAR"],
      }).items,
    ).toHaveLength(0);

    const sheet = fixtureFilterSheet("01S4", {
      ...none,
      sellers: ["CU"],
      nutrients: ["LOW_SUGAR"],
    });
    const chip = (code: string) =>
      sheet.nutrients.find((c) => c.code === code)!;
    expect(chip("LOW_SUGAR")).toMatchObject({
      label: "저당",
      count: 4,
      hidden: false,
    });
    expect(chip("LOW_FAT")).toMatchObject({ count: 0, hidden: true });
    // 「n개 제품 보기」만 고른 조건(CU이면서 저당)으로 센다
    expect(sheet.count).toBe(
      fixtureRanking("01S4", "SCORE", {
        ...none,
        sellers: ["CU"],
        nutrients: ["LOW_SUGAR"],
      }).items.length,
    );
    expect(sheet.count).toBeLessThan(chip("LOW_SUGAR").count);
  });

  it("순위 주소에 영양성분을 칩 순서로 적는다", () => {
    expect(
      rankingHref("01S4", {
        sort: "SCORE",
        filters: {
          sellers: [],
          brands: [],
          nutrients: ["LOW_SUGAR", "HIGH_PROTEIN"],
        },
      }),
    ).toBe("/ranking/01S4?nutrient=LOW_SUGAR&nutrient=HIGH_PROTEIN");
  });

  it("대분류 전체 필터: 묶음마다 맞는 제품만 · 맞는 게 없는 묶음은 빼고, 시트는 대분류의 칩 전체로 센다", () => {
    const none = { sellers: [], brands: [], nutrients: [] };
    const cu = { ...none, sellers: ["CU" as const] };
    const groups = fixtureOverview(FIXTURE_MAJORS[0], 3, cu);
    expect(groups.map((g) => g.chip.code)).toEqual(["01S4"]);
    expect(groups[0].items.map((p) => p.rank)).toEqual([1, 2, 3]);

    const all = fixtureFilterSheet("01", none);
    expect(all.count).toBe(
      FIXTURE_MAJORS[0].chips.reduce(
        (n, c) => n + fixtureRanking(c.code, "SCORE").items.length,
        0,
      ),
    );
    expect(fixtureBrandList("01").map((b) => b.name)).toContain("샐러리아");
  });

  it("걸린 필터를 기준 줄 앞말 · 주소 값으로 바꾼다", () => {
    const none = { sellers: [], brands: [], nutrients: [] };
    expect(filterSummary(none)).toBeNull();
    expect(filterSummary({ ...none, sellers: ["COUPANG"] })).toBe(
      "쿠팡 제품만",
    );
    expect(
      filterSummary({
        sellers: ["CU"],
        brands: ["마이프로틴"],
        nutrients: ["LOW_SUGAR"],
      }),
    ).toBe("CU · 마이프로틴 · 저당 제품만");

    const params = new URLSearchParams(
      "sort=PROTEIN_HIGH&seller=GS25&goal=muscle",
    );
    writeFilterParams(params, {
      ...none,
      sellers: ["CU"],
      nutrients: ["LOW_FAT"],
    });
    expect(params.toString()).toBe(
      "sort=PROTEIN_HIGH&goal=muscle&seller=CU&nutrient=LOW_FAT",
    );
  });

  it("종류를 고르지 않았을 때 시트는 모든 칩의 제품(같은 제품은 한 번)으로 센다", () => {
    const none = { sellers: [], brands: [], nutrients: [] };
    const everything = fixtureFilterSheet(null, none);
    const majorsTotal = FIXTURE_MAJORS.reduce(
      (n, m) => n + fixtureFilterSheet(m.code, none).count,
      0,
    );
    expect(everything.count).toBe(majorsTotal);
    expect(fixtureBrandList(null).map((b) => b.name)).toEqual(
      expect.arrayContaining(["샐러리아", "CJ", "마이프로틴"]),
    );
  });

  it("대분류마다 그림 이름이 있다(없으면 2-5f에 깨진 그림이 나온다)", () => {
    for (const major of FIXTURE_MAJORS)
      expect(MAJOR_ICON[major.code]).toBeTruthy();
  });
});
