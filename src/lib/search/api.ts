import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import type { Goal } from "@/lib/goal/types";
import { toSearchResult, toSearchSuggestion } from "@/lib/search/mapper";
import type {
  PopularKeywordDto,
  SearchDto,
  SearchSuggestionsDto,
} from "@/lib/search/types";

/**
 * `page`는 0부터, `size`는 1~50. 빈 검색어·30자 초과·글자나 숫자가 없는 검색어는 400 `BAD_REQUEST`.
 * `goal`을 빼면 서버가 사용자의 목표로 계산한다
 */
export function fetchSearch(
  http: AxiosInstance,
  params: { q: string; goal?: Goal; page: number; size: number },
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<SearchDto>>("/search", { params, signal })
    .then(unwrap)
    .then(toSearchResult);
}

/** 30자 초과는 400. `size`는 서버 기본 10, 최대 20 */
export function fetchSearchSuggestions(
  http: AxiosInstance,
  q: string,
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<SearchSuggestionsDto>>("/search/suggestions", {
      params: { q },
      signal,
    })
    .then(unwrap)
    .then((dto) => dto.items.map(toSearchSuggestion));
}

export function fetchPopularKeywords(
  http: AxiosInstance,
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<PopularKeywordDto[]>>("/search/keywords/popular", {
      signal,
    })
    .then(unwrap);
}
