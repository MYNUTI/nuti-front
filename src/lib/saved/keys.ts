import type { Goal } from "@/lib/goal/types";

export const savedKeys = {
  all: ["saved"] as const,
  /** 카드의 태그·더 맞는 제품 표시가 목표 기준이라 목표마다 따로 캐시한다 */
  list: (goal: Goal) => [...savedKeys.all, "list", goal] as const,
};
