/**
 * 랭킹 API(v3 SRCH_006 · SRCH_007 · SRCH_008)의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 백엔드 `main` 1ddb9b4의 `RankingDtos`, `ProductCard`, `ListSort`, `FilterChip`, `Seller`, `ProductState`.
 *
 * Swagger(`/v3/api-docs`)의 `RankingResponse.items`·`Group.items`는 이름이 같은 동의 항목 `Item`
 * 스키마로 잘못 나와 있다(같은 이름의 record가 둘이라 springdoc이 하나로 합친다). 항목 모양은 백엔드 소스를 따랐다.
 * Swagger의 `actor` 쿼리 파라미터도 서버가 헤더에서 채우는 값이라 보내지 않는다.
 * 날짜는 타임존 없는 ISO 문자열(`yyyy-MM-ddTHH:mm:ss`)이다.
 */
import type { Goal } from "@/lib/goal/types";
import type { GradeLetter } from "@/lib/product/types";

/** v3 랭킹의 목표는 둘뿐이다. 요청에서 빼면 서버가 감량(`WEIGHT_LOSS`)으로 계산한다 */
export type RankingGoal = Exclude<Goal, "GENERAL">;

/** `POPULAR`는 서버에 있지만 화면(정렬 시트)에서는 인기 자료가 생길 때까지 숨긴다 */
export type RankingSort =
  "SCORE" | "POPULAR" | "CALORIES_LOW" | "PROTEIN_HIGH" | "SUGAR_LOW";

export type NutrientFilter =
  | "LOW_SUGAR"
  | "ZERO_SUGAR"
  | "LOW_CALORIE"
  | "ZERO_CALORIE"
  | "HIGH_PROTEIN"
  | "LOW_FAT";

/** 지금 자료가 붙어 있는 곳은 `COUPANG`뿐이다(나머지는 거르면 0개) */
export type Seller =
  | "COUPANG"
  | "CU"
  | "GS25"
  | "SEVEN_ELEVEN"
  | "EMART24"
  | "OLIVE_YOUNG"
  | "KURLY";

/** 제품 상태 5종. 랭킹에는 `ANALYZED`만 나온다(점수 없음·생산 중단 쪽은 서버가 뺀다) */
export type ProductState =
  | "NO_SCORE"
  | "ANALYZED"
  | "PRODUCTION_STOPPED"
  | "STOCK_REMAINING"
  | "DISCONTINUED";

/** 필터 세 탭. 탭끼리 AND, 탭 안 값끼리 OR */
export type RankingFilters = {
  /** 브랜드 줄 이름 그대로(「제조 ○○」 포함) */
  brands?: string[];
  nutrients?: NutrientFilter[];
  sellers?: Seller[];
};

// ── DTO ──────────────────────────────────────────────────────────────────────

/** 칩 = 중분류 또는 합산 칩. `open`은 분석 완료 300개 이상 */
export type RankingChipDto = {
  code: string;
  name: string;
  aggregate: boolean;
  total: number;
  analyzed: number;
  open: boolean;
};

export type RankingMajorDto = {
  /** 대분류 코드 2자리 */
  code: string;
  name: string;
  /** 순위가 열린 칩만, 탭 순서대로. 닫힌 칩은 오지 않는다 */
  chips: RankingChipDto[];
};

/** `GET /rankings/categories`. 대분류 15개는 늘 온다 */
export type RankingCategoriesDto = {
  majors: RankingMajorDto[];
  /** 마지막 제품 적재 시각. 적재 전이면 null */
  updatedAt: string | null;
};

export type CategoryInfoDto = {
  code: string;
  name: string;
  majorCode: string | null;
  majorName: string | null;
};

/** 「000개 중 000개 점수 있음, 날짜 업데이트」 */
export type CoverageDto = {
  total: number;
  analyzed: number;
  updatedAt: string | null;
};

export type GoalGradeDto = {
  goal: RankingGoal;
  /** 0~100, 소수 첫째 자리까지 */
  score: number;
  grade: GradeLetter;
  label: string;
};

/** 영양소 정렬일 때만 온다. `text`는 서버가 만든 「단백질 21g · 100g당」 */
export type SortValueDto = {
  nutrient: "CALORIES" | "PROTEIN" | "SUGAR";
  value: number;
  unit: string;
  /** `100g` 또는 `100mL` */
  basis: string;
  text: string;
};

/** 검색·랭킹·기록이 같이 쓰는 목록 카드 */
export type ProductCardDto = {
  productId: number;
  name: string;
  /** 브랜드 줄(「제조 ○○」 포함). 없을 수 있다 */
  brandLine: string | null;
  imageUrl: string | null;
  state: ProductState;
  stateLabel: string;
  /** 두 목표의 점수. 점수 없는 제품은 빈 배열 */
  goals: GoalGradeDto[];
  /** 요청한 목표 기준 짧은 말 0~2개. 좋은 점인지 아쉬운 점인지는 오지 않는다(`mapper.ts`의 `tagTone`) */
  tags: string[];
  sortValue?: SortValueDto;
  /** 기록·즐겨찾기·결과에서만 온다 */
  better?: { status: "TOP" | "AVAILABLE" | "NONE"; count: number };
  saved: boolean;
};

export type RankedItemDto = { rank: number; product: ProductCardDto };

/** `GET /rankings`. 열리지 않은 칩은 404 `RANKING_NOT_OPEN`, 없는 칩은 404 `RESOURCE_NOT_FOUND` */
export type RankingDto = {
  category: CategoryInfoDto;
  goal: RankingGoal;
  kcalBand: number;
  sort: RankingSort;
  sortLabel: string;
  coverage: CoverageDto;
  /** 지금 필터에 맞는 제품 수 */
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
  items: RankedItemDto[];
};

export type OverviewGroupDto = {
  category: CategoryInfoDto;
  coverage: CoverageDto;
  /** 그 칩의 점수 높은 순 위 3개 */
  items: RankedItemDto[];
};

/** `GET /rankings/overview`. 열린 칩이 없으면 `groups`가 빈 배열이고, 0개인 칩은 빠진다 */
export type RankingOverviewDto = {
  majorCode: string;
  majorName: string;
  goal: RankingGoal;
  kcalBand: number;
  groups: OverviewGroupDto[];
};

export type NutrientChipDto = {
  code: NutrientFilter;
  label: string;
  /** 기준 설명(「당류 5g(음료 2.5g) 미만」) */
  rule: string;
  count: number;
  /** 그 분류에서 85% 초과이거나 10개 미만이면 숨긴다 */
  hidden: boolean;
};

export type BrandItemDto = { name: string; count: number };

export type SellerCountDto = {
  code: Seller;
  label: string;
  count: number;
  available: boolean;
};

/** `GET /rankings/filters` */
export type FilterSheetDto = {
  /** 「000개 제품 보기」 */
  count: number;
  nutrients: NutrientChipDto[];
  brands: { top: BrandItemDto[]; totalBrands: number };
  sellers: SellerCountDto[];
};

/** `GET /rankings/brands` */
export type BrandListDto = { total: number; items: BrandItemDto[] };

// ── 화면 모델 ────────────────────────────────────────────────────────────────

/** 점수 구간 1(잘 맞음) ~ 5(안 맞음). 공통 부품 `ScoreRing`의 `ScoreBand`와 같은 값이다 */
export type RankingScoreBand = 1 | 2 | 3 | 4 | 5;

export type RankingChip = { code: string; name: string };

export type RankingMajor = {
  code: string;
  name: string;
  /** 순위가 열린 칩만 */
  chips: RankingChip[];
};

export type RankingCategories = {
  majors: RankingMajor[];
  updatedAt: string | null;
};

export type RankingCategory = {
  code: string;
  name: string;
  majorCode: string | null;
  majorName: string | null;
};

export type RankingCoverage = CoverageDto;

export type RankingTag = {
  label: string;
  /** 아쉬운 점(분홍)이면 true */
  warn: boolean;
};

export type RankedProduct = {
  /** 상세 경로와 맞춰 문자열 */
  id: string;
  rank: number;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  /** 요청한 목표의 점수. 응답에 그 목표 점수가 없으면 null */
  score: { value: number; band: RankingScoreBand } | null;
  /** 좋은 점이 앞, 아쉬운 점이 뒤 */
  tags: RankingTag[];
  /** 영양소 정렬일 때 태그 자리에 대신 보일 글(「100g당 단백질 37.7g」) */
  sortText: string | null;
};

/** 한 페이지 응답. 여러 페이지를 합친 결과도 같은 모양이다 */
export type RankingPage = {
  category: RankingCategory;
  goal: RankingGoal;
  sort: RankingSort;
  sortLabel: string;
  coverage: RankingCoverage;
  total: number;
  page: number;
  hasNext: boolean;
  items: RankedProduct[];
};

export type RankingOverviewGroup = {
  category: RankingCategory;
  coverage: RankingCoverage;
  items: RankedProduct[];
};

export type RankingOverview = {
  majorCode: string;
  majorName: string;
  goal: RankingGoal;
  groups: RankingOverviewGroup[];
};

export type RankingFilterSheet = FilterSheetDto;

export type RankingBrandList = BrandListDto;
