import { SEARCH_PAGE_SIZE } from "@/lib/search/page-size";

import { SEARCH_SORTS, type SearchSort } from "./sorts";

/** 2-4 한 번에 불러오는 개수(【최종】 메모: 12개씩). 주소의 `?n=`도 이 단위다 */
export const PAGE_SIZE = SEARCH_PAGE_SIZE;

/** 주소로 되살릴 때 이어 부르는 페이지 수 상한. `?n=`이 커도 요청이 끝없이 나가지 않게 한다 */
export const MAX_RESTORE_PAGES = 10;

/** 서버가 30자를 넘는 검색어를 400으로 거절한다 */
export const MAX_QUERY_LENGTH = 30;

/** 서버는 글자 · 숫자를 남기고 정규화해 비면 400으로 거절한다(「검색어에 글자나 숫자가 없습니다」). 그런 말은 부르지 않는다 */
export function isSearchable(query: string) {
  return /[\p{L}\p{Nd}]/u.test(query);
}

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
        ? Math.min(Math.ceil(n / PAGE_SIZE), MAX_RESTORE_PAGES) * PAGE_SIZE
        : PAGE_SIZE,
  };
}
