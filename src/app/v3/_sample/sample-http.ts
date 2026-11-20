/*
 * 예시 자료를 서버 응답처럼 돌려주는 axios 인스턴스(검토용). 요청은 네트워크로 나가지 않는다.
 * 실제 서버와 같은 규칙으로 답한다 — 주소·쿼리 이름, 공통 응답 모양(`{ isSuccess, data }`),
 * 페이지 나누기, 열린 칩 0개면 빈 `groups`, 없는 분류는 404.
 * 예시에 없는 것: 필터(brands·nutrients·sellers)는 받아도 거르지 않고, 칼로리·당류 값이 없어
 * 그 두 정렬은 서버가 「값 없는 제품」을 다루는 방식대로 점수 순서 그대로 + `sortValue` 없이 답한다.
 */
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";

import { toApiError } from "@/lib/api/errors";
import type { RankingSource } from "@/lib/ranking/queries";
import type {
  BrandListDto,
  FilterSheetDto,
  OverviewGroupDto,
  ProductCardDto,
  RankedItemDto,
  RankingDto,
  RankingGoal,
  RankingOverviewDto,
  RankingSort,
} from "@/lib/ranking/types";

import {
  SAMPLE_CATEGORIES,
  SAMPLE_PRODUCTS,
  sampleCategoryInfo,
  sampleCoverage,
  type SampleProduct,
} from "./ranking-sample";

const SORT_LABEL: Record<RankingSort, string> = {
  SCORE: "점수 높은 순",
  POPULAR: "인기순",
  CALORIES_LOW: "칼로리 낮은 순",
  PROTEIN_HIGH: "단백질 많은 순",
  SUGAR_LOW: "당류 적은 순",
};

// 서버 `RankingService.OVERVIEW_TOP`
const OVERVIEW_TOP = 3;

type Reply = { status: number; body: unknown };

function ok(data: unknown): Reply {
  return { status: 200, body: { isSuccess: true, data } };
}

function fail(status: number, code: string, message: string): Reply {
  return {
    status,
    body: {
      isSuccess: false,
      data: {
        timestamp: "2026-10-18T03:00:00",
        path: "/rankings",
        code,
        message,
        details: null,
      },
    },
  };
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function goalOf(value: unknown): RankingGoal {
  return value === "MUSCLE_GAIN" ? "MUSCLE_GAIN" : "WEIGHT_LOSS";
}

function sortOf(value: unknown): RankingSort {
  const raw = text(value)?.toUpperCase();
  return raw && raw in SORT_LABEL ? (raw as RankingSort) : "SCORE";
}

/** 예시 전용 값(`proteinPer100g`)을 떼고 서버 카드 모양만 남긴다 */
function toCard(product: SampleProduct, sort: RankingSort): ProductCardDto {
  const { proteinPer100g, ...card } = product;
  if (sort !== "PROTEIN_HIGH" || proteinPer100g === undefined) return card;
  return {
    ...card,
    sortValue: {
      nutrient: "PROTEIN",
      value: proteinPer100g,
      unit: "g",
      basis: "100g",
      text: `단백질 ${proteinPer100g}g · 100g당`,
    },
  };
}

function sorted(products: SampleProduct[], sort: RankingSort) {
  if (sort !== "PROTEIN_HIGH") return products;
  // 서버 규칙: 값이 없는 제품은 맨 뒤, 그 안에서는 점수 순서 그대로(Array.sort는 안정 정렬)
  return [...products].sort(
    (a, b) => (b.proteinPer100g ?? -1) - (a.proteinPer100g ?? -1),
  );
}

function ranked(
  products: SampleProduct[],
  sort: RankingSort,
  offset = 0,
): RankedItemDto[] {
  return products.map((product, index) => ({
    rank: offset + index + 1,
    product: toCard(product, sort),
  }));
}

function ranking(params: Record<string, unknown>): Reply {
  const code = text(params.category);
  if (!code) return fail(400, "BAD_REQUEST", "category(칩 코드)는 필수입니다.");
  const category = sampleCategoryInfo(code);
  if (!category) return fail(404, "RESOURCE_NOT_FOUND", "없는 분류입니다.");

  const page = Number(params.page ?? 0);
  const size = Number(params.size ?? 20);
  if (!(page >= 0) || !(size >= 1 && size <= 50))
    return fail(
      400,
      "INVALID_QUERY_PARAM",
      "page는 0 이상, size는 1~50이어야 합니다.",
    );

  const sort = sortOf(params.sort);
  const all = sorted(SAMPLE_PRODUCTS[code] ?? [], sort);
  const data: RankingDto = {
    category,
    goal: goalOf(params.goal),
    kcalBand: 2000,
    sort,
    sortLabel: SORT_LABEL[sort],
    coverage: sampleCoverage(code),
    total: all.length,
    page,
    size,
    hasNext: (page + 1) * size < all.length,
    items: ranked(all.slice(page * size, (page + 1) * size), sort, page * size),
  };
  return ok(data);
}

function overview(params: Record<string, unknown>): Reply {
  const major = SAMPLE_CATEGORIES.majors.find((m) => m.code === params.major);
  if (!major) return fail(404, "RESOURCE_NOT_FOUND", "없는 대분류입니다.");

  const groups: OverviewGroupDto[] = [];
  for (const chip of major.chips) {
    const products = SAMPLE_PRODUCTS[chip.code] ?? [];
    // 서버 규칙: 0개인 칩은 뺀다
    if (products.length === 0) continue;
    groups.push({
      category: {
        code: chip.code,
        name: chip.name,
        majorCode: major.code,
        majorName: major.name,
      },
      coverage: sampleCoverage(chip.code),
      items: ranked(products.slice(0, OVERVIEW_TOP), "SCORE"),
    });
  }
  const data: RankingOverviewDto = {
    majorCode: major.code,
    majorName: major.name,
    goal: goalOf(params.goal),
    kcalBand: 2000,
    groups,
  };
  return ok(data);
}

/** 칩 코드면 그 칩, 대분류 코드면 대분류 전체의 예시 제품. 없는 코드면 null */
function productsIn(code: string | undefined): SampleProduct[] | null {
  if (!code) return null;
  const major = SAMPLE_CATEGORIES.majors.find((m) => m.code === code);
  if (major)
    return major.chips.flatMap((chip) => SAMPLE_PRODUCTS[chip.code] ?? []);
  return sampleCategoryInfo(code) ? (SAMPLE_PRODUCTS[code] ?? []) : null;
}

function brandCounts(products: SampleProduct[]) {
  const counts = new Map<string, number>();
  for (const { brandLine } of products)
    if (brandLine) counts.set(brandLine, (counts.get(brandLine) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count }));
}

function filters(params: Record<string, unknown>): Reply {
  const products = productsIn(text(params.category));
  if (!products) return fail(404, "RESOURCE_NOT_FOUND", "없는 분류입니다.");
  const brands = brandCounts(products).sort((a, b) => b.count - a.count);
  const data: FilterSheetDto = {
    count: products.length,
    // 예시에는 영양 값이 없어 칩을 모두 숨김으로 둔다(서버 규칙: 10개 미만이면 숨김)
    nutrients: [],
    brands: { top: brands.slice(0, 8), totalBrands: brands.length },
    sellers: [
      { code: "COUPANG", label: "쿠팡", count: 0, available: true },
      { code: "CU", label: "CU", count: 0, available: false },
      { code: "GS25", label: "GS25", count: 0, available: false },
      { code: "SEVEN_ELEVEN", label: "세븐일레븐", count: 0, available: false },
      { code: "EMART24", label: "이마트24", count: 0, available: false },
      { code: "OLIVE_YOUNG", label: "올리브영", count: 0, available: false },
      { code: "KURLY", label: "컬리", count: 0, available: false },
    ],
  };
  return ok(data);
}

function brands(params: Record<string, unknown>): Reply {
  const products = productsIn(text(params.category));
  if (!products) return fail(404, "RESOURCE_NOT_FOUND", "없는 분류입니다.");
  const needle = text(params.q)?.trim() ?? "";
  const items = brandCounts(products)
    .filter((brand) => brand.name.includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const data: BrandListDto = { total: items.length, items };
  return ok(data);
}

function route(config: InternalAxiosRequestConfig): Reply {
  const params: Record<string, unknown> = config.params ?? {};
  switch (config.url) {
    case "/rankings/categories":
      return ok(SAMPLE_CATEGORIES);
    case "/rankings":
      return ranking(params);
    case "/rankings/overview":
      return overview(params);
    case "/rankings/filters":
      return filters(params);
    case "/rankings/brands":
      return brands(params);
    default:
      return fail(404, "RESOURCE_NOT_FOUND", "예시 자료에 없는 주소입니다.");
  }
}

/** 실제 adapter처럼 2xx가 아니면 `AxiosError`로 reject한다 */
export const sampleAdapter: AxiosAdapter = async (config) => {
  const { status, body } = route(config);
  const response = {
    status,
    statusText: String(status),
    data: body,
    headers: new AxiosHeaders(),
    config,
  };
  if (status >= 200 && status < 300) return response;
  throw new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    null,
    response,
  );
};

function createSampleHttp() {
  const instance = axios.create({ adapter: sampleAdapter });
  // 실제 인스턴스(`lib/api/client.ts`)와 같이 실패를 `ApiError`로 바꾼다
  instance.interceptors.response.use(undefined, (error) =>
    Promise.reject(toApiError(error)),
  );
  return instance;
}

export const sampleRanking: RankingSource = {
  id: "sample",
  http: createSampleHttp(),
};
