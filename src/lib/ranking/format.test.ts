import { describe, expect, it } from "vitest";
import {
  formatCoverage,
  formatUpdatedDate,
  parseRankingGoal,
  parseRankingSort,
} from "@/lib/ranking/format";

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

  it("주소의 목표 값: 미리보기 값과 서버 값을 받고 그 밖은 서버 기본에 맡긴다", () => {
    expect(parseRankingGoal("diet")).toBe("WEIGHT_LOSS");
    expect(parseRankingGoal("muscle")).toBe("MUSCLE_GAIN");
    expect(parseRankingGoal("MUSCLE_GAIN")).toBe("MUSCLE_GAIN");
    expect(parseRankingGoal("GENERAL")).toBeUndefined();
    expect(parseRankingGoal(undefined)).toBeUndefined();
  });
});
