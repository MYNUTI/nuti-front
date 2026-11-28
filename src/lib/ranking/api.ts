import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import {
  toRankingCategories,
  toRankingLeaders,
  toRankingOverview,
  toRankingPage,
} from "@/lib/ranking/mapper";
import type {
  BrandListDto,
  FilterSheetDto,
  RankingCategoriesDto,
  RankingDto,
  RankingFilters,
  RankingGoal,
  RankingLeadersDto,
  RankingOverviewDto,
  RankingSort,
} from "@/lib/ranking/types";

/*
 * 배열(brands·nutrients·sellers)은 `brands=a&brands=b`로 보낸다. axios 기본값(`brands[]=a`)은 서버가
 * 받는 이름(`brands`)과 달라 필터가 빠진다.
 */
const paramsSerializer = { indexes: null };

/*
 * 값이 하나뿐이면 서버(Spring)는 그 글자를 쉼표에서 나눠 목록으로 읽는다. 그래서 쉼표가 든 브랜드 하나
 * (「A,B」)는 「A」와 「B」 두 브랜드로 읽힌다. 값이 둘 이상이면 나누지 않으므로, 이 경우에만 같은 이름을
 * 두 번 보낸다. 서버가 같은 값을 하나로 합친다(`RankingService.filters`의 `distinct()`).
 * 실제 서버에서 확인하지는 못했다(배포 서버를 시험 삼아 부르지 않는다). API 플랜 「남은 질문」에서 확인을 기다린다.
 */
function brandParams(brands: string[] = []) {
  if (brands.length === 0) return undefined;
  if (brands.length === 1 && brands[0].includes(","))
    return [brands[0], brands[0]];
  return brands;
}

/** 빈 배열은 보내지 않는다(보내면 `brands=`가 붙는다) */
function filterParams(filters: RankingFilters = {}) {
  return {
    brands: brandParams(filters.brands),
    nutrients: filters.nutrients?.length ? filters.nutrients : undefined,
    sellers: filters.sellers?.length ? filters.sellers : undefined,
  };
}

/** 대분류 15개 + 순위가 열린 칩 */
export function fetchRankingCategories(
  http: AxiosInstance,
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<RankingCategoriesDto>>("/rankings/categories", { signal })
    .then(unwrap)
    .then(toRankingCategories);
}

/**
 * 칩 하나의 순위. `page`는 0부터, `size`는 1~50(벗어나면 400 `INVALID_QUERY_PARAM`).
 * `goal`을 빼면 서버가 감량으로, `sort`를 빼면 점수 높은 순으로 계산한다.
 * 열리지 않은 칩은 404 `RANKING_NOT_OPEN`, 없는 칩은 404 `RESOURCE_NOT_FOUND`.
 */
export function fetchRanking(
  http: AxiosInstance,
  params: {
    category: string;
    goal?: RankingGoal;
    sort?: RankingSort;
    page: number;
    size: number;
    filters?: RankingFilters;
  },
  signal?: AbortSignal,
) {
  const { filters, ...rest } = params;
  return http
    .get<ApiSuccess<RankingDto>>("/rankings", {
      params: { ...rest, ...filterParams(filters) },
      paramsSerializer,
      signal,
    })
    .then(unwrap)
    .then(toRankingPage);
}

/**
 * 첫 화면(종류를 고르지 않았을 때): 대분류마다 순위가 열린 중분류 앞 3개의 1위. 대분류마다 `overview`를 부르지 않고
 * 한 번에 받는다
 */
export function fetchRankingLeaders(
  http: AxiosInstance,
  params: { goal?: RankingGoal; filters?: RankingFilters },
  signal?: AbortSignal,
) {
  const { filters, ...rest } = params;
  return http
    .get<ApiSuccess<RankingLeadersDto>>("/rankings/leaders", {
      params: { ...rest, ...filterParams(filters) },
      paramsSerializer,
      signal,
    })
    .then(unwrap)
    .then(toRankingLeaders);
}

/** 대분류 전체: 열린 칩마다 점수 높은 순 위 3개. 없는 대분류는 404 `RESOURCE_NOT_FOUND` */
export function fetchRankingOverview(
  http: AxiosInstance,
  params: { major: string; goal?: RankingGoal; filters?: RankingFilters },
  signal?: AbortSignal,
) {
  const { filters, ...rest } = params;
  return http
    .get<ApiSuccess<RankingOverviewDto>>("/rankings/overview", {
      params: { ...rest, ...filterParams(filters) },
      paramsSerializer,
      signal,
    })
    .then(unwrap)
    .then(toRankingOverview);
}

/** 필터 시트. `category`는 칩 코드나 대분류 코드 */
export function fetchRankingFilters(
  http: AxiosInstance,
  params: { category: string; filters?: RankingFilters },
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<FilterSheetDto>>("/rankings/filters", {
      params: { category: params.category, ...filterParams(params.filters) },
      paramsSerializer,
      signal,
    })
    .then(unwrap);
}

/** 브랜드 더 보기(가나다순). `q`는 이름에 포함된 글자 */
export function fetchRankingBrands(
  http: AxiosInstance,
  params: { category: string; q?: string },
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<BrandListDto>>("/rankings/brands", {
      params: { category: params.category, q: params.q?.trim() || undefined },
      signal,
    })
    .then(unwrap);
}
