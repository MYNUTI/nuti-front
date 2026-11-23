import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import type { Goal } from "@/lib/goal/types";
import { toSearchResult, toSearchSuggestion } from "@/lib/search/mapper";
import type {
  PopularKeywordsDto,
  SearchDto,
  SearchSort,
  SearchSuggestionsDto,
} from "@/lib/search/types";

/**
 * `page`는 0부터, `size`는 1~50. 빈 검색어·30자 초과·글자나 숫자가 없는 검색어는 400 `BAD_REQUEST`.
 * `goal`을 빼면 서버가 내 목표가 아니라 WEIGHT_LOSS로 계산해 늘 보낸다. `sort`를 빼면 점수 높은 순이다
 */
export function fetchSearch(
  http: AxiosInstance,
  params: {
    q: string;
    goal: Goal;
    sort?: SearchSort;
    page: number;
    size: number;
  },
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

/** 최근 7일 검색한 사람 수가 많은 순으로 최대 10개. 매시 정각에 다시 모은다 */
export function fetchPopularKeywords(
  http: AxiosInstance,
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<PopularKeywordsDto>>("/search/keywords/popular", {
      signal,
    })
    .then(unwrap);
}
