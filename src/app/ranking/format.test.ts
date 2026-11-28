import { describe, expect, it } from "vitest";

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

// `review/v3-rankings`의 `src/lib/ranking/format.test.ts`를 옮겼다
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

describe("랭킹 주소 값 · 칩 글자", () => {
  it("불러온 개수는 12의 배수로 읽고(상한 10페이지) 틀린 값은 12", () => {
    expect(parseRankingShown("100000")).toBe(120);
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

  it("순위 주소에 판매처를 여러 번 적는다", () => {
    expect(
      rankingHref("01S4", {
        sort: "SCORE",
        filters: { sellers: ["CU", "GS25"], brands: [], nutrients: [] },
      }),
    ).toBe("/ranking/01S4?seller=CU&seller=GS25");
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

  it("순위 주소에 판매처 · 브랜드를 함께 적는다", () => {
    expect(
      rankingHref("01S4", {
        sort: "SCORE",
        filters: { sellers: ["CU"], brands: ["마이프로틴"], nutrients: [] },
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

  it("영양성분은 아는 값만 칩 순서로 읽고, 칩 글자는 1개면 이름 · 2개 이상이면 「영양성분 n」", () => {
    expect(
      parseRankingNutrients(["HIGH_PROTEIN", "LOW_SUGAR", "SALTY"]),
    ).toEqual(["LOW_SUGAR", "HIGH_PROTEIN"]);
    expect(nutrientChipLabel([])).toBe("영양성분");
    expect(nutrientChipLabel(["HIGH_PROTEIN"])).toBe("고단백");
    expect(nutrientChipLabel(["LOW_SUGAR", "HIGH_PROTEIN"])).toBe("영양성분 2");
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

  it("대분류 15개(01–15, 백엔드 분류 시드)마다 그림 이름이 있다(없으면 2-5f에 깨진 그림이 나온다)", () => {
    for (let n = 1; n <= 15; n++)
      expect(MAJOR_ICON[String(n).padStart(2, "0")]).toBeTruthy();
  });
});
