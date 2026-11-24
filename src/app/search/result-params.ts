import { SEARCH_SORTS, type SearchSort } from "./_fixtures";

/** 2-4 한 번에 불러오는 개수(【최종】 메모: 12개씩) */
export const PAGE_SIZE = 12;

/** 주소의 `sort` · `n`을 정렬 · 불러온 개수로 읽는다. 틀린 값은 기본(점수 높은 순 · 12개) */
export function readResultParams(get: (name: string) => string | null): {
  sort: SearchSort;
  shown: number;
} {
  const sort = SEARCH_SORTS.find((s) => s.value === get("sort"))?.value;
  const n = Number(get("n"));
  return {
    sort: sort ?? "score",
    shown:
      Number.isInteger(n) && n > PAGE_SIZE
        ? Math.ceil(n / PAGE_SIZE) * PAGE_SIZE
        : PAGE_SIZE,
  };
}
