/**
 * 검색 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 배포 Swagger(2026-11-21)와 백엔드 `main` `1ddb9b4`의 `SearchResponse`, `SearchSuggestionResponse`,
 * `PopularKeywordResponse`. 자동완성·인기 검색어 항목은 Swagger의 스키마 이름 충돌로 가려져 소스로 확인했다.
 */
import type { Goal } from "@/lib/goal/types";
import type { ProductCardData, ProductCardDto } from "@/lib/product/types";

/** 점수 높은 순(기본) · 인기순 · 칼로리 낮은 순 · 단백질 많은 순 · 당류 적은 순(영양소는 100g·100mL당) */
export type SearchSort =
  "SCORE" | "POPULAR" | "CALORIES_LOW" | "PROTEIN_HIGH" | "SUGAR_LOW";

// ── DTO ──────────────────────────────────────────────────────────────────────

/**
 * `GET /search`. 묶음 없이 한 목록이고 0건도 200이다. 카드의 태그는 `goal` 기준(영양소 정렬이면 `sortValue`).
 * `pinned`·`category`·`didYouMean`은 `@JsonInclude(NON_NULL)`이라 없으면 키가 빠진다
 */
export type SearchDto = {
  query: string;
  goal: Goal;
  kcalBand: number;
  sort: SearchSort;
  sortLabel: string;
  /** `pinned`를 포함한 「검색 결과 n개」 */
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
  /** 검색어가 제품 이름 전체와 같은 제품. 첫 페이지에서만 오고 `items`에는 없다 */
  pinned?: ProductCardDto;
  /** 검색어가 중분류 이름과 같으면 「○○ 순위로 보기」 */
  category?: { code: string; name: string };
  items: ProductCardDto[];
  /** 0건일 때 */
  didYouMean?: string;
  /** 0건일 때 추정한 종류의 점수 상위. 없으면 빈 배열 */
  sameCategoryTop: ProductCardDto[];
  analysisRequestAvailable: boolean;
};

/** `GET /search/suggestions`. 1자 이하는 빈 배열 */
export type SearchSuggestionsDto = {
  items: SearchSuggestionDto[];
};

export type SearchSuggestionDto = {
  type: "PRODUCT" | "KEYWORD";
  /** PRODUCT일 때만 온다 */
  productId?: number;
  name: string;
  /** PRODUCT이고 브랜드가 있을 때만 온다 */
  brandName?: string;
  /** `name`에서 질의가 매치된 [start, end) 구간. 유사도로 잡힌 제안은 빈 배열 */
  matchedRanges: [number, number][];
};

/** `GET /search/keywords/popular`. 아직 모으기 전이면 `basedAt` null · `keywords` 빈 배열 */
export type PopularKeywordsDto = {
  basedAt: string | null;
  keywords: PopularKeyword[];
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

/** 한 페이지 응답. 여러 페이지를 합친 결과도 같은 모양이다 */
export type SearchResult = {
  query: string;
  goal: Goal;
  sort: SearchSort;
  sortLabel: string;
  total: number;
  hasNext: boolean;
  pinned: ProductCardData | null;
  category: { code: string; name: string } | null;
  items: ProductCardData[];
  didYouMean: string | null;
  sameCategoryTop: ProductCardData[];
  canRequestAnalysis: boolean;
};

export type SearchSuggestion = {
  name: string;
  matchedRanges: [number, number][];
} & (
  | { type: "PRODUCT"; productId: string; brandName: string | null }
  | { type: "KEYWORD" }
);

export type PopularKeyword = { rank: number; keyword: string };

export type PopularKeywords = PopularKeywordsDto;
