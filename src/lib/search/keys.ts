import type { Goal } from "@/lib/goal/types";
import type { SearchSort } from "@/lib/search/types";

export const searchKeys = {
  all: ["search"] as const,
  results: () => [...searchKeys.all, "results"] as const,
  /** 카드의 점수·태그와 점수순이 목표 기준이라 목표마다 따로 캐시한다 */
  result: (q: string, goal: Goal, sort: SearchSort = "SCORE") =>
    [...searchKeys.results(), q, goal, sort] as const,
  suggestions: (q: string) => [...searchKeys.all, "suggestions", q] as const,
  popularKeywords: () => [...searchKeys.all, "popular-keywords"] as const,
};
