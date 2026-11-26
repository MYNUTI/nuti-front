/*
 * 2-3 검색 임시 데이터. API 연결 때 인기 검색어는 `GET /search/keywords/popular`, 자동완성은
 * `GET /search/suggestions`(일치 구간 `matchedRanges`를 서버가 준다)로 바꾼다(UI 플랜 「데이터」).
 * 자동완성 후보는 3-2 제품 결과 fixture의 제품이라 눌러도 제품 결과가 열린다.
 */
import type { Goal } from "@/app/my/_fixtures";
import { FIXTURE_PRODUCTS } from "@/app/product/[id]/_fixtures";
import type { ProductCardInput } from "@/components/common/product-card";
import type { ScoreBand } from "@/components/common/score-ring";

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

// ── 2-4 검색 결과 ───────────────────────────────────────────────────────────

export type SearchSort = "score" | "calories" | "protein" | "sugar";

/** 2-4 「목표: ○○ ›」. API 연결 때 내 목표(`goal`)로 바꾼다 */
export const FIXTURE_SEARCH_GOAL: Goal = "diet";

/** 【최종】 정렬 시트 4줄(「인기순」은 인기 자료가 생기면 다시 보인다) */
export const SEARCH_SORTS: { value: SearchSort; label: string }[] = [
  { value: "score", label: "점수 높은 순" },
  { value: "calories", label: "칼로리 낮은 순" },
  { value: "protein", label: "단백질 많은 순" },
  { value: "sugar", label: "당류 적은 순" },
];

export type SearchResultItem = ProductCardInput & {
  /** 분류(API `category` — 코드 · 이름) */
  category: { code: string; name: string };
  /** 정렬용 100g(음료는 100mL)당 값 */
  per100: { calories: number; protein: number; sugar: number } | null;
  /** 누르면 갈 곳. 기본은 3-2 제품 결과 */
  href?: string;
};

const item = (
  id: string,
  brand: string,
  name: string,
  score: number | null,
  band: ScoreBand | null,
  tags: SearchResultItem["tags"],
  per100: SearchResultItem["per100"],
  image: string | null = null,
  imageSize = 400,
  href?: string,
): SearchResultItem => ({
  id,
  brand,
  name,
  image,
  imageSize,
  score,
  band,
  tags,
  per100,
  category: { code: "01S4", name: "프로틴바·간식" },
  href,
});

const HIGH_PROTEIN = { label: "고단백" };
const LOW_SUGAR = { label: "저당" };
const warn = (label: string) => ({ label, warn: true });

/*
 * 앞 6개는 【최종】 2-4 그림 순서 그대로(점수는 3-2 fixture와 같게). 뒤는 「더 불러오기」를 보이려는 자리 표시라
 * 【최종】 메모(프로토타입에서만)처럼 3-2 디자인 제품(4)으로 이어 둔다. 점수 없는 제품은 3-6(08단계)으로 간다
 */
const POOL: SearchResultItem[] = [
  item(
    "11",
    "마이프로틴",
    "하이프로틴바 초콜렛 오렌지",
    89,
    1,
    [HIGH_PROTEIN, LOW_SUGAR],
    { calories: 350, protein: 34, sugar: 3.9 },
    "/fixtures/product-2.png",
  ),
  item(
    "5",
    "커클랜드 시그니처",
    "프로틴바 초콜릿 브라우니",
    92,
    1,
    [HIGH_PROTEIN, LOW_SUGAR, warn("고포화지방")],
    { calories: 317, protein: 35, sugar: 3.3 },
    "/fixtures/product-1.png",
    800,
  ),
  item(
    "3",
    "칼만스",
    "프로틴바 솔티드 다크초코&아몬드",
    86,
    1,
    [HIGH_PROTEIN],
    { calories: 330, protein: 30, sugar: 4.6 },
    "/fixtures/product-3.png",
  ),
  item(
    "4",
    "미트리",
    "카카오초코 프로틴바",
    62,
    3,
    [HIGH_PROTEIN, warn("고칼로리")],
    { calories: 413, protein: 37.7, sugar: 12.7 },
    "/fixtures/product-4.png",
    600,
  ),
  // 3-6(검색이나 기록에서) fixture와 같은 제품(이름 · 사진). 카드는 이름 앞 브랜드를 떼고 보인다
  item(
    "p1",
    "올가니카",
    "올가니카 올라 츄이프로틴바 베리아몬드",
    null,
    null,
    [],
    null,
    "/fixtures/product-5.png",
    400,
    "/contribute/product/p1",
  ),
  ...[
    [
      "p2",
      "단백질연구소",
      "단백질연구소 프로틴바 피넛버터",
      84,
      1,
      { calories: 360, protein: 32, sugar: 5 },
    ],
    [
      "p3",
      "그린플러스",
      "그린 프로틴바 쿠키앤크림",
      78,
      2,
      { calories: 372, protein: 28, sugar: 7.1 },
    ],
    [
      "p4",
      "바른간식",
      "바른 프로틴바 카라멜",
      74,
      2,
      { calories: 388, protein: 25, sugar: 9.2 },
    ],
    [
      "p5",
      "데일리핏",
      "데일리 프로틴바 초코",
      70,
      2,
      { calories: 395, protein: 24, sugar: 10.4 },
    ],
    [
      "p6",
      "오늘단백",
      "오늘단백 프로틴바 바닐라",
      66,
      3,
      { calories: 401, protein: 22, sugar: 11 },
    ],
    [
      "p7",
      "스포츠랩",
      "스포츠랩 하이 프로틴바",
      58,
      3,
      { calories: 410, protein: 30, sugar: 14.5 },
    ],
    [
      "p8",
      "에너지바",
      "에너지 프로틴바 땅콩",
      52,
      3,
      { calories: 432, protein: 20, sugar: 16 },
    ],
    [
      "p9",
      "스위트바",
      "스위트 프로틴바 딸기",
      44,
      4,
      { calories: 445, protein: 15, sugar: 22 },
    ],
    [
      "p10",
      "크런치",
      "크런치 프로틴바 초코칩",
      38,
      4,
      { calories: 460, protein: 14, sugar: 25 },
    ],
    [
      "p11",
      "허니바",
      "허니 프로틴바 아몬드",
      31,
      5,
      { calories: 470, protein: 12, sugar: 28 },
    ],
  ].map(([id, brand, name, score, band, per100]) =>
    item(
      id as string,
      brand as string,
      name as string,
      score as number,
      band as ScoreBand,
      [HIGH_PROTEIN],
      per100 as SearchResultItem["per100"],
      null,
      400,
      "/product/4",
    ),
  ),
];

export type SearchResult = {
  total: number;
  /** 검색어가 제품 이름 전체와 같으면 그 제품(맨 위 한 칸에 따로) */
  exact: SearchResultItem | null;
  items: SearchResultItem[];
  /**
   * 「○○ 순위 보기」에 쓰는 분류. 서버(`SearchResponse.category`)는 검색어가 중분류 이름과 같을 때만 주는데
   * fixture는 결과에 가장 많은 분류로 둔다(남은 질문 28)
   */
  category: { code: string; name: string } | null;
};

const SORT_KEY: Record<SearchSort, (i: SearchResultItem) => number | null> = {
  score: (i) => (i.score === null ? null : -i.score),
  calories: (i) => i.per100?.calories ?? null,
  protein: (i) => (i.per100 ? -i.per100.protein : null),
  sugar: (i) => i.per100?.sugar ?? null,
};

/** 이름이나 브랜드에 검색어가 들어간 제품. 값이 없는 제품(점수 없음 등)은 어느 순서든 맨 뒤 */
export function fixtureSearch(query: string, sort: SearchSort): SearchResult {
  const q = query.trim();
  const hits = POOL.filter(
    (p) => matchRange(p.name, q) !== null || matchRange(p.brand, q) !== null,
  );
  const key = SORT_KEY[sort];
  const sorted = hits
    .map((p, index) => ({ p, index, k: key(p) }))
    .sort((a, b) =>
      a.k === null
        ? b.k === null
          ? a.index - b.index
          : 1
        : b.k === null
          ? -1
          : a.k - b.k || a.index - b.index,
    )
    .map(({ p }) => p);
  const exact = sorted.find((p) => p.name === q) ?? null;
  const counts = new Map<
    string,
    { category: SearchResultItem["category"]; n: number }
  >();
  for (const p of hits) {
    const seen = counts.get(p.category.code);
    counts.set(p.category.code, {
      category: p.category,
      n: (seen?.n ?? 0) + 1,
    });
  }
  const category =
    [...counts.values()].sort((a, b) => b.n - a.n)[0]?.category ?? null;
  return {
    total: hits.length,
    exact,
    items: exact ? sorted.filter((p) => p !== exact) : sorted,
    category,
  };
}

// ── 2-4b 검색 0건 ───────────────────────────────────────────────────────────
// POOL(프로틴바 계열)에 안 맞는 말이면 0건이다. 그림과 같은 칩은 `/search?q=단백질 웨하스`

// 같은 뜻으로 바꿔 볼 말(자리 표시). API 연결 때 `didYouMean` · 서버 추천으로 바꾼다
const SYNONYMS: Record<string, string> = {
  단백질: "프로틴",
  프로틴: "단백질",
};

/**
 * 「이렇게 찾아볼까요?」 칩. 띄어쓰기를 붙인 말, 같은 뜻의 말로 바꾼 말, 마지막 낱말 순(【최종】 그림:
 * 「단백질 웨하스」 → 「단백질웨하스」 · 「프로틴 웨하스」 · 「웨하스」). 찾은 말과 같은 것은 뺀다
 */
export function fixtureAlternatives(query: string): string[] {
  const q = query.trim();
  const words = q.split(/\s+/);
  const candidates = [
    words.join(""),
    words.map((w) => SYNONYMS[w] ?? w).join(" "),
    words.at(-1) ?? "",
  ];
  return candidates.filter(
    (c, i) => c !== "" && c !== q && candidates.indexOf(c) === i,
  );
}

/** 「점수가 높은 비슷한 제품」 3개(API의 `sameCategoryTop`, 자리 표시는 【최종】 그림 제품) */
export function fixtureSimilarTop(): SearchResultItem[] {
  return POOL.filter((p) => p.score !== null && p.image !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);
}
