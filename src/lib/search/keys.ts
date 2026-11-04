import type { Goal } from "@/lib/goal/types";

export const searchKeys = {
  all: ["search"] as const,
  results: () => [...searchKeys.all, "results"] as const,
  result: (q: string, goal?: Goal) =>
    [...searchKeys.results(), q, goal ?? null] as const,
  suggestions: (q: string) => [...searchKeys.all, "suggestions", q] as const,
  popularKeywords: () => [...searchKeys.all, "popular-keywords"] as const,
};
