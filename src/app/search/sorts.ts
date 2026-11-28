import type { SearchSort as ApiSearchSort } from "@/lib/search/types";

/** 2-4 정렬(주소 `?sort=`에 남기는 화면 값) */
export type SearchSort = "score" | "calories" | "protein" | "sugar";

/** 【최종】 정렬 시트 4줄(「인기순」은 인기 자료가 생기면 다시 보인다) */
export const SEARCH_SORTS: { value: SearchSort; label: string }[] = [
  { value: "score", label: "점수 높은 순" },
  { value: "calories", label: "칼로리 낮은 순" },
  { value: "protein", label: "단백질 많은 순" },
  { value: "sugar", label: "당류 적은 순" },
];

/** 영양소 정렬은 100g(음료 100mL)당 값으로 서버가 정렬한다 */
export const API_SORT: Record<SearchSort, ApiSearchSort> = {
  score: "SCORE",
  calories: "CALORIES_LOW",
  protein: "PROTEIN_HIGH",
  sugar: "SUGAR_LOW",
};
