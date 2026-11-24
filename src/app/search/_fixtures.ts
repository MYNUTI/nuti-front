/*
 * 2-3 검색 임시 데이터. API 연결 때 인기 검색어는 `GET /search/keywords/popular`, 자동완성은
 * `GET /search/suggestions`(일치 구간 `matchedRanges`를 서버가 준다)로 바꾼다(UI 플랜 「데이터」).
 * 자동완성 후보는 3-2 제품 결과 fixture의 제품이라 눌러도 제품 결과가 열린다.
 */
import { FIXTURE_PRODUCTS } from "@/app/product/[id]/_fixtures";

import { matchRange } from "./hangul";

/** 【최종】 2-3 검색 「인기 검색어」 그림 값 */
export const FIXTURE_POPULAR_KEYWORDS = {
  updatedLabel: "11월 5일 16:00 업데이트",
  words: [
    "프로틴바",
    "닭가슴살",
    "제로 콜라",
    "단백질 쉐이크",
    "곤약 젤리",
    "그릭요거트",
    "저당 과자",
    "두유",
    "샐러드",
    "컵라면",
  ],
};

export type Suggestion = {
  id: string;
  name: string;
  brand: string | null;
  image: { src: string; size: number } | null;
  /** name에서 검색어가 나온 [시작, 끝). 브랜드로만 맞으면 없다 */
  range: [number, number] | null;
};

// 인기순(자리 표시). 같은 이름은 앞의 것만 쓴다
const POPULAR_ORDER = ["5", "4", "11", "3", "1", "2", "12"];

const CANDIDATES = POPULAR_ORDER.map((id) => FIXTURE_PRODUCTS[id]).filter(
  (product, index, all) =>
    all.findIndex((other) => other.name === product.name) === index,
);

/**
 * 자동완성. API처럼 1자 이하는 빈 목록. 이름에 포함(초성 포함) 또는 브랜드 이름이 맞는 제품을 인기순으로.
 * 【최종】 메모: 브랜드 이름을 치면 그 브랜드의 제품을 후보로 띄운다(브랜드만 따로 띄우는 줄은 없다)
 */
export function fixtureSuggestions(query: string): Suggestion[] {
  const q = query.trim();
  if (q.length <= 1) return [];
  return CANDIDATES.flatMap((product) => {
    const range = matchRange(product.name, q);
    const brandHit =
      product.brand !== null && matchRange(product.brand, q) !== null;
    if (!range && !brandHit) return [];
    return [
      {
        id: product.id,
        name: product.name,
        brand: product.brand,
        image: product.image,
        range,
      },
    ];
  });
}
