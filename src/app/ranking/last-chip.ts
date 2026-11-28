/*
 * 마지막에 본 중분류. 【최종】 2-2 메모: 하단 탭 「랭킹」을 처음 누르면 종류를 고르지 않은 화면, 다시 누르면
 * 마지막에 본 중분류. 브라우저에 둔다(저장이 막혔으면 매번 처음 화면).
 */
import { majorOf, type RankingMajor } from "./model";

const KEY = "nuti_ranking_last_v1";

export function readLastChip(majors: readonly RankingMajor[]): string | null {
  try {
    const code = localStorage.getItem(KEY);
    // 없어졌거나 닫힌 칩(분류가 바뀜)이면 버린다
    return code && majorOf(majors, code) ? code : null;
  } catch {
    return null;
  }
}

export function writeLastChip(code: string) {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // 저장이 막혔으면 다음에 처음 화면으로 연다
  }
}
