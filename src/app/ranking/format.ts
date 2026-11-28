/*
 * 2-2 점수 순위의 글자 · 주소 값 다루기. `review/v3-rankings`의 `src/lib/ranking/format.ts`를 옮겼다
 * (API 연결 때 그 파일로 바꾼다).
 */
import { toChosung } from "../search/hangul";

import {
  NO_FILTERS,
  NUTRIENT_CHIPS,
  type NutrientFilter,
  type RankingCoverage,
  type RankingFilters,
  type RankingGoal,
  type RankingSort,
  type Seller,
} from "./_fixtures";

/** 화면에서 부르는 목표 이름. 서버 문구는 「체중 감량」이라 화면 이름을 따로 둔다 */
export const RANKING_GOAL_LABEL: Record<RankingGoal, string> = {
  WEIGHT_LOSS: "다이어트",
  MUSCLE_GAIN: "근육 증가",
};

/** 정렬 시트의 줄(【최종】 2-2 정렬 고르기). 「인기순」은 인기 자료가 생길 때까지 숨긴다 */
export const RANKING_SORT_OPTIONS: { value: RankingSort; label: string }[] = [
  { value: "SCORE", label: "점수 높은 순" },
  { value: "CALORIES_LOW", label: "칼로리 낮은 순" },
  { value: "PROTEIN_HIGH", label: "단백질 많은 순" },
  { value: "SUGAR_LOW", label: "당류 적은 순" },
];

export type FilterTab = "seller" | "brand" | "nutrient";

export const FILTER_TAB_LABEL: Record<FilterTab, string> = {
  seller: "판매처",
  brand: "브랜드",
  nutrient: "영양성분",
};

/**
 * 대분류 코드 → 그림 이름(`public/home/category/<이름>.png`, 홈 대분류 타일과 같은 그림).
 * 【최종】 그림 한 장(5×3)을 칸마다 잘라 썼다. 2-5f 메모 「안 정함: 분류 아이콘」
 */
export const MAJOR_ICON: Record<string, string> = {
  "01": "diet-protein",
  "02": "ready-meal",
  "03": "drink",
  "04": "bakery",
  "05": "snack",
  "06": "noodle",
  "07": "meat",
  "08": "dairy",
  "09": "seafood",
  "10": "grain",
  "11": "coffee-tea",
  "12": "seasoning",
  "13": "side-dish",
  "14": "health",
  "15": "fruit-veg",
};

export const DEFAULT_RANKING_SORT: RankingSort = "SCORE";

/** 【최종】 메모: 목록 끝에 닿을 때마다 다음 12개 */
export const RANKING_PAGE_SIZE = 12;

/** 주소의 `?n=`(불러온 개수)을 읽는다. 12의 배수로 올리고, 틀렸거나 12 이하면 12 */
export function parseRankingShown(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > RANKING_PAGE_SIZE
    ? Math.ceil(n / RANKING_PAGE_SIZE) * RANKING_PAGE_SIZE
    : RANKING_PAGE_SIZE;
}

/** 주소의 `?sort=` 값을 정렬로 읽는다. 시트에 없는 값은 기본 정렬 */
export function parseRankingSort(value: unknown): RankingSort {
  return (
    RANKING_SORT_OPTIONS.find((option) => option.value === value)?.value ??
    DEFAULT_RANKING_SORT
  );
}

/** 필터 시트 판매처 탭의 줄(【최종】 2-5b, 홈 「판매처별로 보기」와 같은 순서) */
export const SELLER_OPTIONS: { value: Seller; label: string }[] = [
  { value: "COUPANG", label: "쿠팡" },
  { value: "CU", label: "CU" },
  { value: "GS25", label: "GS25" },
  { value: "SEVEN_ELEVEN", label: "세븐일레븐" },
  { value: "EMART24", label: "이마트24" },
  { value: "OLIVE_YOUNG", label: "올리브영" },
  { value: "KURLY", label: "컬리" },
];

export const sellerLabel = (seller: Seller) =>
  SELLER_OPTIONS.find((o) => o.value === seller)!.label;

/** 주소의 `?seller=`(여러 번 올 수 있다)를 판매처로 읽는다. 모르는 값은 버리고 시트 순서로 둔다 */
export function parseRankingSellers(value: unknown): Seller[] {
  const values = Array.isArray(value) ? value : [value];
  return SELLER_OPTIONS.map((o) => o.value).filter((s) => values.includes(s));
}

/** 주소의 `?seller=` · `?brand=`를 필터로 읽는다 */
export function parseRankingFilters(
  seller: unknown,
  brand: unknown,
  nutrient: unknown,
): RankingFilters {
  return {
    sellers: parseRankingSellers(seller),
    brands: parseRankingBrands(brand),
    nutrients: parseRankingNutrients(nutrient),
  };
}

export const hasFilters = (filters: RankingFilters) =>
  filters.sellers.length > 0 ||
  filters.brands.length > 0 ||
  filters.nutrients.length > 0;

/** 주소의 `?nutrient=`(여러 번 올 수 있다)를 영양성분 칩으로 읽는다. 모르는 값은 버리고 칩 순서로 둔다 */
export function parseRankingNutrients(value: unknown): NutrientFilter[] {
  const values = Array.isArray(value) ? value : [value];
  return NUTRIENT_CHIPS.map((c) => c.code).filter((c) => values.includes(c));
}

export const nutrientLabel = (code: NutrientFilter) =>
  NUTRIENT_CHIPS.find((c) => c.code === code)!.label;

/**
 * 고른 영양성분 칩 글자: 1개면 그 이름, 2개 이상이면 「영양성분 2」. 여럿일 때는 그림 · 메모에 없어
 * 2-5 브랜드 메모(「브랜드 2」)를 따랐다(남은 질문 32)
 */
export function nutrientChipLabel(nutrients: NutrientFilter[]): string {
  if (nutrients.length === 0) return "영양성분";
  return nutrients.length === 1
    ? nutrientLabel(nutrients[0])
    : `영양성분 ${nutrients.length}`;
}

/** 주소 값에 필터를 쓴다(있던 필터 값은 지우고 다시 쓴다. 다른 값은 그대로) */
export function writeFilterParams(
  params: URLSearchParams,
  filters: RankingFilters,
) {
  params.delete("seller");
  for (const seller of filters.sellers) params.append("seller", seller);
  params.delete("brand");
  for (const brand of filters.brands) params.append("brand", brand);
  params.delete("nutrient");
  for (const nutrient of filters.nutrients) params.append("nutrient", nutrient);
}

/**
 * 대분류 전체 기준 줄 앞에 붙는 걸린 필터(【최종】 「쿠팡 제품만, …」). 그림은 판매처 하나뿐이라 여럿 · 다른 탭은
 * 고른 값을 「 · 」로 잇는다(남은 질문 37). 걸린 필터가 없으면 null
 */
export function filterSummary(filters: RankingFilters): string | null {
  const values = [
    ...filters.sellers.map(sellerLabel),
    ...filters.brands,
    ...filters.nutrients.map(nutrientLabel),
  ];
  return values.length > 0 ? `${values.join(" · ")} 제품만` : null;
}

/** 주소의 `?brand=`(여러 번 올 수 있다)를 브랜드 이름으로 읽는다. 빈 값 · 겹친 값은 버린다 */
export function parseRankingBrands(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
}

// 2-5 메모: 칩의 브랜드 이름은 8자를 넘으면 말줄임
const BRAND_CHIP_MAX = 8;

/** 고른 브랜드 칩 글자(2-5 메모): 1곳이면 그 이름(8자 넘으면 말줄임), 2곳 이상이면 「브랜드 2」 */
export function brandChipLabel(brands: string[]): string {
  if (brands.length === 0) return "브랜드";
  if (brands.length > 1) return `브랜드 ${brands.length}`;
  const chars = Array.from(brands[0]);
  return chars.length > BRAND_CHIP_MAX
    ? `${chars.slice(0, BRAND_CHIP_MAX).join("")}…`
    : brands[0];
}

// 겹자음은 사전처럼 홑자음 머리에 넣는다(ㄲ → ㄱ)
const DOUBLE_CONSONANT: Record<string, string> = {
  ㄲ: "ㄱ",
  ㄸ: "ㄷ",
  ㅃ: "ㅂ",
  ㅆ: "ㅅ",
  ㅉ: "ㅈ",
};
const HANGUL_LETTERS = [..."ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ"];
// 그림에는 한글 머리만 있다. 영문 · 숫자로 시작하는 브랜드는 한글 뒤 「A–Z」 · 「#」 머리로 둔다(남은 질문 35)
const LATIN_LETTER = "A–Z";
const OTHER_LETTER = "#";
const koCollator = new Intl.Collator("ko");

/** 2-5e 가나다 머리 글자: 한글이면 첫 글자의 초성(겹자음은 홑자음), 영문이면 「A–Z」, 그 밖은 「#」 */
export function brandIndexLetter(name: string): string {
  const first = toChosung(name.trim().normalize("NFC"))[0] ?? "";
  if (HANGUL_LETTERS.includes(first) || first in DOUBLE_CONSONANT)
    return DOUBLE_CONSONANT[first] ?? first;
  return /[a-z]/i.test(first) ? LATIN_LETTER : OTHER_LETTER;
}

/** 2-5e 브랜드 목록을 가나다 머리로 묶는다. 머리는 ㄱ~ㅎ · A–Z · # 순, 머리 안은 가나다순 */
export function groupBrandsByLetter<T extends { name: string }>(
  brands: T[],
): { letter: string; brands: T[] }[] {
  const order = [...HANGUL_LETTERS, LATIN_LETTER, OTHER_LETTER];
  const groups = new Map<string, T[]>();
  for (const brand of [...brands].sort((a, b) =>
    koCollator.compare(a.name, b.name),
  )) {
    const letter = brandIndexLetter(brand.name);
    groups.set(letter, [...(groups.get(letter) ?? []), brand]);
  }
  return order
    .filter((letter) => groups.has(letter))
    .map((letter) => ({ letter, brands: groups.get(letter)! }));
}

/**
 * 고른 판매처 칩 글자: 하나면 그 이름, 여럿이면 「CU 외 1」. 고르지 않았으면 「판매처」.
 * 여럿일 때 모양은 그림에 없어 임시로 정했다(남은 질문 32)
 */
export function sellerChipLabel(sellers: Seller[]): string {
  if (sellers.length === 0) return "판매처";
  const first = sellerLabel(sellers[0]);
  return sellers.length === 1 ? first : `${first} 외 ${sellers.length - 1}`;
}

/**
 * 순위 화면 주소(`/ranking/[code]`, 칩이나 대분류 코드). 기본 정렬 · 다이어트 목표 · 빈 필터는 적지 않는다.
 * 【최종】 메모: 고른 정렬 · 필터는 탭을 옮겨도 유지한다
 */
export function rankingHref(
  code: string,
  {
    sort,
    filters = NO_FILTERS,
  }: { sort: RankingSort; filters?: RankingFilters },
): string {
  const params = new URLSearchParams();
  if (sort !== DEFAULT_RANKING_SORT) params.set("sort", sort);
  writeFilterParams(params, filters);
  const query = params.toString();
  return `/ranking/${encodeURIComponent(code)}${query ? `?${query}` : ""}`;
}

/**
 * 「10월 18일」. 서버 날짜는 타임존 없는 ISO 문자열이라 글자에서 월 · 일만 읽는다
 * (`new Date()`로 읽으면 보는 기기의 시간대에 따라 하루 밀릴 수 있다). 읽지 못하면 null
 */
export function formatUpdatedDate(iso: string | null): string | null {
  const match = iso ? /^\d{4}-(\d{2})-(\d{2})/.exec(iso) : null;
  if (!match) return null;
  return `${Number(match[1])}월 ${Number(match[2])}일`;
}

/**
 * 「52개 중 48개 점수 있음, 10월 18일 업데이트」. 모두 점수가 있으면 「52개, 10월 18일 업데이트」(SRCH_007).
 * 날짜가 없으면 개수만
 */
export function formatCoverage(coverage: RankingCoverage): string {
  const total = coverage.total.toLocaleString("ko-KR");
  const counts =
    coverage.analyzed >= coverage.total
      ? `${total}개`
      : `${total}개 중 ${coverage.analyzed.toLocaleString("ko-KR")}개 점수 있음`;
  const date = formatUpdatedDate(coverage.updatedAt);
  return date ? `${counts}, ${date} 업데이트` : counts;
}
