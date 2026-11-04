/**
 * 검색 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 백엔드 커밋 c164ec0의 `SearchResponse`, `SearchSuggestionResponse`, `PopularKeywordResponse`.
 */
import type { Goal } from "@/lib/goal/types";
import type { GradeLetter, ProductStatus } from "@/lib/product/types";

// ── DTO ──────────────────────────────────────────────────────────────────────

/** 검색 결과 항목. 영양정보 부족 상품도 나오고 등급순 맨 뒤다 */
export type SearchItemDto = {
  productId: number;
  name: string;
  brandName: string | null;
  imageUrl: string | null;
  status: ProductStatus;
  /** INSUFFICIENT면 없다 */
  grade?: GradeLetter;
  /** INSUFFICIENT면 없다 */
  gradeLabel?: string;
  /** 목표 기준 감점 요인 문구(「당류 21g — 체중 감량 기준 초과」). 감점이 없거나 INSUFFICIENT면 없다 */
  highlight?: string;
  isSaved: boolean;
};

/** 두 섹션은 같은 `page`·`size`로 함께 넘어가고, `total`은 섹션마다 따로다 */
export type SearchSectionDto = { total: number; items: SearchItemDto[] };

/** `GET /search`. 0건도 200이고 폴백(교정어·같은 분류 상위·분석 요청)을 함께 담는다 */
export type SearchDto = {
  query: string;
  appliedGoal: Goal;
  /** 그대로 포함·공백/특수문자 제거·초성·브랜드명 일치 */
  exactMatches: SearchSectionDto;
  /** 철자 유사도·동의어 */
  similarProducts: SearchSectionDto;
  /** 교정 결과가 실존하고 편집거리 2 이하일 때만 온다 */
  didYouMean?: string;
  /** 0건일 때만 채워진다(가장 비슷한 상품의 분류에서 등급 상위 5) */
  sameCategoryTop: SearchItemDto[];
  /** 0건이면 true. 「찾으시는 제품을 알려주세요」 */
  analysisRequest: { available: boolean };
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

/** `GET /search/keywords/popular`의 항목 */
export type PopularKeywordDto = { rank: number; keyword: string };

// ── 화면 모델 ────────────────────────────────────────────────────────────────

/** 상품 결과와 같은 방식으로 등급 유무를 status로 나눈다 */
export type SearchItem = {
  /** 상세 경로와 맞춰 문자열 */
  id: string;
  name: string;
  brandName: string | null;
  imageUrl: string | null;
  saved: boolean;
} & (
  | {
      status: "ANALYZED";
      grade: GradeLetter;
      label: string;
      highlight: string | null;
    }
  | { status: "INSUFFICIENT" }
);

export type SearchSection = { total: number; items: SearchItem[] };

/** 한 페이지 응답. 여러 페이지를 합친 결과도 같은 모양이다 */
export type SearchResult = {
  query: string;
  appliedGoal: Goal;
  exactMatches: SearchSection;
  similarProducts: SearchSection;
  didYouMean: string | null;
  sameCategoryTop: SearchItem[];
  canRequestAnalysis: boolean;
};

export type SearchSuggestion = {
  name: string;
  matchedRanges: [number, number][];
} & (
  | { type: "PRODUCT"; productId: string; brandName: string | null }
  | { type: "KEYWORD" }
);

export type PopularKeyword = PopularKeywordDto;
