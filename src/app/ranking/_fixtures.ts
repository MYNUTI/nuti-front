/*
 * 2-2 점수 순위 임시 데이터. 모양은 `review/v3-rankings` 브랜치의 `src/lib/ranking` 화면 모델을 그대로 따른다.
 * API 연결 때 이 파일의 함수를 그 브랜치의 쿼리 훅(`useRankingCategories` · `useRankingOverviews` · `useRanking`)으로
 * 바꾸면 된다(UI 플랜 「데이터」). 대분류 15개 · 칩은 그 브랜치의 예시 자료(백엔드 분류 시드)를 옮겼다.
 *
 * - 커클랜드(5) · 마이프로틴(11) · 칼만스(3) · 미트리(4)는 3-2 제품 결과 fixture와 같은 번호 · 점수라 누르면 결과가 열린다
 * - 나머지 제품은 【최종】 그림의 예시 값이고, 【최종】 메모(프로토타입에서만)처럼 3-2 디자인 제품(4)으로 이어 둔다
 * - 태그는 【최종】 그림의 말(「고단백」 「저당」 「고포화지방」)로 적었다. 서버는 다른 말 · 최대 2개를 준다(남은 질문 30)
 */
import type { ScoreBand } from "@/components/common/score-ring";

export type RankingGoal = "WEIGHT_LOSS" | "MUSCLE_GAIN";

/** `POPULAR`는 서버에 있지만 인기 자료가 생길 때까지 정렬 시트에서 숨긴다 */
export type RankingSort =
  "SCORE" | "CALORIES_LOW" | "PROTEIN_HIGH" | "SUGAR_LOW";

export type RankingChip = { code: string; name: string };

/** 판매처 7곳(API `Seller`). 지금 서버에 자료가 붙어 있는 곳은 쿠팡뿐이다 */
export type Seller =
  | "COUPANG"
  | "CU"
  | "GS25"
  | "SEVEN_ELEVEN"
  | "EMART24"
  | "OLIVE_YOUNG"
  | "KURLY";

/** 영양성분 칩 6개(API `NutrientFilter`, 백엔드 `FilterChip`) */
export type NutrientFilter =
  | "LOW_SUGAR"
  | "ZERO_SUGAR"
  | "LOW_CALORIE"
  | "ZERO_CALORIE"
  | "HIGH_PROTEIN"
  | "LOW_FAT";

/** 필터(API `RankingFilters`). 탭끼리는 AND, 탭 안 값끼리는 OR */
export type RankingFilters = {
  sellers: Seller[];
  /** 브랜드 줄 이름 그대로(「제조 ○○」 포함) */
  brands: string[];
  nutrients: NutrientFilter[];
};

export const NO_FILTERS: RankingFilters = {
  sellers: [],
  brands: [],
  nutrients: [],
};

export type RankingMajor = {
  code: string;
  name: string;
  /** 순위가 열린 칩만, 탭 순서대로 */
  chips: RankingChip[];
};

export type RankingCoverage = {
  total: number;
  analyzed: number;
  updatedAt: string | null;
};

export type RankedProduct = {
  id: string;
  rank: number;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  score: { value: number; band: ScoreBand } | null;
  /** 좋은 점이 앞, 아쉬운 점(분홍)이 뒤 */
  tags: { label: string; warn: boolean }[];
  /** 영양소 정렬일 때 태그 자리에 대신 보일 글(「100g당 단백질 37.7g」) */
  sortText: string | null;
  /** 누르면 갈 곳. 기본은 그 제품의 3-2 제품 결과 */
  href?: string;
};

const UPDATED_AT = "2026-10-18T03:00:00";

type FixtureProduct = Omit<RankedProduct, "rank" | "sortText"> & {
  /** 지방은 fixture에 값이 없다 — 서버처럼 값이 없으면 저지방에 해당하지 않는다 */
  per100: { calories: number; protein: number; sugar: number; fat?: number };
};

const tag = (label: string, warn = false) => ({ label, warn });
const HIGH_PROTEIN = tag("고단백");
const LOW_SUGAR = tag("저당");
const SAT_FAT = tag("고포화지방", true);

const known = (
  id: string,
  brand: string,
  name: string,
  value: number,
  band: ScoreBand,
  tags: RankedProduct["tags"],
  imageUrl: string,
  per100: FixtureProduct["per100"],
): FixtureProduct => ({
  id,
  name,
  brand,
  imageUrl,
  score: { value, band },
  tags,
  per100,
});

const sample = (
  id: string,
  brand: string | null,
  name: string,
  value: number,
  band: ScoreBand,
  tags: RankedProduct["tags"],
  per100: FixtureProduct["per100"],
  imageUrl: string | null = null,
): FixtureProduct => ({
  id,
  name,
  brand,
  imageUrl,
  score: { value, band },
  tags,
  per100,
  href: "/product/4",
});

/** 칩 코드 → 제품(순서는 정렬이 정한다) */
const PRODUCTS: Record<string, FixtureProduct[]> = {
  "01S4": [
    known(
      "11",
      "마이프로틴",
      "하이프로틴바 초콜렛 오렌지",
      89,
      1,
      [HIGH_PROTEIN, LOW_SUGAR, SAT_FAT],
      "/fixtures/product-2.png",
      { calories: 350, protein: 34, sugar: 3.9 },
    ),
    known(
      "5",
      "커클랜드 시그니처",
      "프로틴바 초콜릿 브라우니",
      92,
      1,
      [HIGH_PROTEIN, LOW_SUGAR, SAT_FAT],
      "/fixtures/product-1.png",
      { calories: 317, protein: 35, sugar: 3.3 },
    ),
    sample(
      "r9003",
      "마이프로틴",
      "하이프로틴바",
      87,
      1,
      [HIGH_PROTEIN, LOW_SUGAR],
      { calories: 355, protein: 32, sugar: 4.2 },
      "/fixtures/product-2.png",
    ),
    known(
      "3",
      "칼만스",
      "프로틴바 솔티드 다크초코&아몬드",
      86,
      1,
      [HIGH_PROTEIN, SAT_FAT],
      "/fixtures/product-3.png",
      { calories: 330, protein: 30, sugar: 4.6 },
    ),
    known(
      "4",
      "미트리",
      "카카오초코 프로틴바",
      62,
      3,
      [HIGH_PROTEIN, tag("고칼로리", true)],
      "/fixtures/product-4.png",
      { calories: 413, protein: 37.7, sugar: 12.7 },
    ),
    sample(
      "r9006",
      "오리온",
      "닥터유단백질바",
      41,
      5,
      [HIGH_PROTEIN, SAT_FAT],
      { calories: 452, protein: 22, sugar: 18 },
    ),
    sample("r9007", "닥터유", "단백질바 미니", 41, 5, [HIGH_PROTEIN, SAT_FAT], {
      calories: 448,
      protein: 21,
      sugar: 19,
    }),
    sample(
      "r9008",
      "닥터유",
      "프로 단백질바 크런치 미니",
      40,
      5,
      [HIGH_PROTEIN, SAT_FAT],
      { calories: 455, protein: 20, sugar: 20 },
    ),
    sample(
      "r9009",
      "청정원",
      "프로틴 초코볼&너츠",
      37,
      5,
      [HIGH_PROTEIN, SAT_FAT],
      { calories: 470, protein: 18, sugar: 24 },
    ),
    sample("r9010", "아이즈", "프로틴초코볼", 37, 5, [HIGH_PROTEIN, SAT_FAT], {
      calories: 468,
      protein: 19,
      sugar: 25,
    }),
    sample(
      "r9011",
      // 브랜드 줄이 「제조 ○○」인 제품(2-5 메모: 그런 회사는 「브랜드 더 보기」에만 나온다)
      "제조 씨알푸드",
      "초콜릿 프로틴바",
      37,
      5,
      [HIGH_PROTEIN, SAT_FAT],
      { calories: 462, protein: 20, sugar: 23 },
    ),
    sample(
      "r9012",
      "마이프로틴",
      "프로틴 초코딥",
      35,
      5,
      [HIGH_PROTEIN, SAT_FAT],
      { calories: 480, protein: 16, sugar: 28 },
    ),
    sample(
      "r9013",
      "그린플러스",
      "그린 프로틴바 쿠키앤크림",
      33,
      5,
      [HIGH_PROTEIN, SAT_FAT],
      { calories: 485, protein: 15, sugar: 29 },
    ),
    sample(
      "r9014",
      "바른간식",
      "바른 프로틴바 카라멜",
      31,
      5,
      [HIGH_PROTEIN, SAT_FAT],
      { calories: 490, protein: 14, sugar: 30 },
    ),
  ],
  "01S1": [
    sample(
      "r9101",
      "샐러리아",
      "오리지널 닭가슴살 포케",
      81,
      1,
      [HIGH_PROTEIN],
      { calories: 120, protein: 14, sugar: 2 },
    ),
    sample(
      "r9104",
      "스윗밸런스",
      "닭가슴살과 오징어 포케 샐러드",
      80,
      1,
      [HIGH_PROTEIN, LOW_SUGAR],
      { calories: 110, protein: 13, sugar: 2.5 },
    ),
    sample(
      "r9105",
      "샐러드박스",
      "수비드 닭가슴살 샐러드",
      77,
      1,
      [HIGH_PROTEIN],
      { calories: 105, protein: 12, sugar: 3 },
    ),
  ],
  "01S2": [
    sample(
      "r9102",
      "하림",
      "닭가슴바블랙페퍼80g",
      74,
      2,
      [HIGH_PROTEIN, tag("고나트륨", true)],
      { calories: 150, protein: 22, sugar: 1.5 },
    ),
    sample(
      "r9106",
      "사조",
      "닭가슴살마일드100G",
      72,
      2,
      [HIGH_PROTEIN, tag("고나트륨", true)],
      { calories: 110, protein: 23, sugar: 0.5 },
    ),
    sample(
      "r9107",
      "사조",
      "닭가슴살블랙페퍼100G",
      72,
      2,
      [HIGH_PROTEIN, tag("고나트륨", true)],
      { calories: 115, protein: 22, sugar: 1 },
    ),
  ],
  "01S3": [
    sample(
      "r9103",
      "풀무원",
      "건강을 제면한 넓은 두부면",
      89,
      1,
      [HIGH_PROTEIN, tag("저칼로리")],
      { calories: 90, protein: 9, sugar: 0.5 },
    ),
  ],
  "0201": [
    sample(
      "r9201",
      "CJ",
      "비비고닭곰탕500G",
      73,
      2,
      [tag("저칼로리"), tag("고나트륨", true)],
      { calories: 45, protein: 5, sugar: 0.3 },
    ),
    sample(
      "r9204",
      "CJ",
      "비비고영양삼계탕",
      72,
      2,
      [HIGH_PROTEIN, tag("고나트륨", true)],
      { calories: 95, protein: 9, sugar: 0.4 },
    ),
    sample(
      "r9205",
      "오뚜기",
      "마포식차돌된장찌개500G",
      64,
      3,
      [tag("고나트륨", true)],
      { calories: 60, protein: 4, sugar: 1.2 },
    ),
  ],
  "0202": [
    sample("r9202", "CJ", "햇반100%현미밥130G(3입)", 72, 2, [LOW_SUGAR], {
      calories: 150,
      protein: 3,
      sugar: 0.2,
    }),
    sample("r9206", "CJ", "컵반참치마요덮밥", 64, 3, [SAT_FAT], {
      calories: 190,
      protein: 6,
      sugar: 3,
    }),
    sample("r9207", "오뚜기", "컵밥제육덮밥", 59, 3, [tag("고나트륨", true)], {
      calories: 170,
      protein: 5,
      sugar: 4,
    }),
  ],
  // 브랜드 줄이 없는 제품(【최종】 「샌드위치·버거 1위」 줄)
  "0203": [
    sample("r9203", null, "통새우치즈버거", 54, 4, [HIGH_PROTEIN, SAT_FAT], {
      calories: 260,
      protein: 12,
      sugar: 6,
    }),
  ],
};

/*
 * 제품마다 파는 곳. 적지 않은 제품은 쿠팡만. 【최종】 「필터 적용, 판매처」 그림처럼 프로틴바 · 간식에서 CU를 고르면 4개가 남게
 * 몇 제품에 편의점을 더했다(서버는 지금 쿠팡 말고는 0개를 준다 — 그림 확인용 값)
 */
const SELLERS_BY_ID: Record<string, Seller[]> = {
  "11": ["COUPANG", "CU", "GS25"],
  "5": ["COUPANG", "CU"],
  "3": ["COUPANG", "CU", "OLIVE_YOUNG"],
  "4": ["COUPANG", "CU", "SEVEN_ELEVEN"],
  r9003: ["COUPANG", "GS25", "EMART24"],
  r9006: ["COUPANG", "KURLY"],
  r9101: ["COUPANG", "KURLY"],
};

const sellersOf = (id: string): Seller[] => SELLERS_BY_ID[id] ?? ["COUPANG"];

/*
 * 영양성분 칩 판정(백엔드 `FilterChip.sql()`, 식약처 영양강조표시 기준 · 100g당). fixture 제품은 모두 음료가 아니라
 * 음료 기준(100mL당)은 옮기지 않았다. 제로 칼로리는 음료만 해당이라 늘 아니다
 */
const NUTRIENT_TEST: Record<
  NutrientFilter,
  (p: FixtureProduct["per100"]) => boolean
> = {
  LOW_SUGAR: (p) => p.sugar < 5,
  ZERO_SUGAR: (p) => p.sugar < 0.5,
  LOW_CALORIE: (p) => p.calories < 40,
  ZERO_CALORIE: () => false,
  HIGH_PROTEIN: (p) =>
    p.protein >= 11 ||
    (p.calories > 0 && (p.protein * 100) / p.calories >= 5.5),
  LOW_FAT: (p) => p.fat !== undefined && p.fat < 3,
};

/** 백엔드 `FilterChip`의 라벨 · 기준 글(필터 시트 `nutrients[].label` · `rule`) */
export const NUTRIENT_CHIPS: {
  code: NutrientFilter;
  label: string;
  rule: string;
}[] = [
  { code: "LOW_SUGAR", label: "저당", rule: "당류 5g(음료 2.5g) 미만" },
  { code: "ZERO_SUGAR", label: "제로 슈거", rule: "당류 0.5g 미만" },
  { code: "LOW_CALORIE", label: "저칼로리", rule: "40kcal(음료 20kcal) 미만" },
  {
    code: "ZERO_CALORIE",
    label: "제로 칼로리",
    rule: "음료 100mL당 4kcal 미만",
  },
  {
    code: "HIGH_PROTEIN",
    label: "고단백",
    rule: "단백질 11g(음료 5.5g) 이상, 또는 100kcal당 5.5g 이상",
  },
  { code: "LOW_FAT", label: "저지방", rule: "지방 3g(음료 1.5g) 미만" },
];

const matches = (product: FixtureProduct, filters: RankingFilters) =>
  (filters.sellers.length === 0 ||
    sellersOf(product.id).some((s) => filters.sellers.includes(s))) &&
  (filters.brands.length === 0 ||
    (product.brand !== null && filters.brands.includes(product.brand))) &&
  (filters.nutrients.length === 0 ||
    filters.nutrients.some((n) => NUTRIENT_TEST[n](product.per100)));

/** 대분류 15개(백엔드 분류 시드의 코드 · 이름 · 순서). 순위가 열린 칩은 앞의 두 대분류에만 둔다 */
export const FIXTURE_MAJORS: RankingMajor[] = [
  {
    code: "01",
    name: "다이어트·단백질",
    chips: [
      { code: "01S1", name: "샐러드" },
      { code: "01S2", name: "닭가슴살" },
      { code: "01S3", name: "두부·곤약" },
      { code: "0101", name: "단백질 파우더" },
      { code: "01S4", name: "프로틴바·간식" },
      { code: "01S5", name: "단백질 음료" },
    ],
  },
  {
    code: "02",
    name: "간편식",
    chips: [
      { code: "0201", name: "국·탕·찌개" },
      { code: "0202", name: "즉석밥·덮밥" },
      { code: "0203", name: "샌드위치·버거" },
    ],
  },
  ...[
    ["03", "음료"],
    ["04", "빵·케이크·잼"],
    ["05", "과자·초콜릿·떡"],
    ["06", "라면·면"],
    ["07", "고기·햄·달걀"],
    ["08", "유제품·아이스크림"],
    ["09", "수산물·건어물"],
    ["10", "쌀·잡곡·견과"],
    ["11", "커피·차"],
    ["12", "양념·소스·기름"],
    ["13", "반찬·김치·두부"],
    ["14", "건강식품"],
    ["15", "과일·채소"],
  ].map(([code, name]) => ({ code, name, chips: [] })),
];

export const FIXTURE_UPDATED_AT = UPDATED_AT;

/** 대분류 코드(2자리)로 찾는다. 칩 코드면 null */
export function findMajor(code: string): RankingMajor | null {
  return FIXTURE_MAJORS.find((m) => m.code === code) ?? null;
}

export function majorOf(chipCode: string): RankingMajor | null {
  return (
    FIXTURE_MAJORS.find((m) => m.chips.some((c) => c.code === chipCode)) ?? null
  );
}

const SORT_TEXT: Partial<
  Record<RankingSort, (p: FixtureProduct["per100"]) => string>
> = {
  CALORIES_LOW: (p) => `100g당 칼로리 ${p.calories}kcal`,
  PROTEIN_HIGH: (p) => `100g당 단백질 ${p.protein}g`,
  SUGAR_LOW: (p) => `100g당 당류 ${p.sugar}g`,
};

const SORT_KEY: Record<RankingSort, (p: FixtureProduct) => number> = {
  SCORE: (p) => -(p.score?.value ?? -1),
  CALORIES_LOW: (p) => p.per100.calories,
  PROTEIN_HIGH: (p) => -p.per100.protein,
  SUGAR_LOW: (p) => p.per100.sugar,
};

/**
 * 중분류 하나의 순위(`GET /rankings` 여러 쪽을 합친 모양). 순위는 그 정렬 · 필터에서의 자리.
 * 필터를 걸면 개수 줄은 남은 제품 수만 센다
 */
export function fixtureRanking(
  chipCode: string,
  sort: RankingSort,
  filters: RankingFilters = NO_FILTERS,
): { items: RankedProduct[]; coverage: RankingCoverage } {
  const all = PRODUCTS[chipCode] ?? [];
  const products = all.filter((p) => matches(p, filters));
  const key = SORT_KEY[sort];
  const text = SORT_TEXT[sort];
  const items = products
    .map((p, index) => ({ p, index }))
    .sort((a, b) => key(a.p) - key(b.p) || a.index - b.index)
    .map(({ p }, i) => {
      const { per100, ...rest } = p;
      return { ...rest, rank: i + 1, sortText: text ? text(per100) : null };
    });
  const analyzed = products.length;
  // 프로틴바 · 간식만 점수 없는 제품이 하나 더 있는 것으로 둬 「n개 중 m개 점수 있음」 꼴을 보인다
  const total =
    chipCode === "01S4" && products.length === all.length
      ? analyzed + 1
      : analyzed;
  return { items, coverage: { total, analyzed, updatedAt: UPDATED_AT } };
}

/**
 * 순위 · 필터 시트의 범위: 칩 코드면 그 칩, 대분류 코드면 그 대분류의 칩 전체, null(종류를 고르지 않음)이면 모든 칩
 * (같은 제품은 한 번). API의 `/rankings/filters` · `/rankings/brands`는 `category`가 필수라 null 범위가 없다(남은 질문 38)
 */
function productsOf(code: string | null): FixtureProduct[] {
  const major = code === null ? null : findMajor(code);
  if (code !== null && !major) return PRODUCTS[code] ?? [];
  const chips = major ? major.chips : FIXTURE_MAJORS.flatMap((m) => m.chips);
  const byId = new Map<string, FixtureProduct>();
  for (const chip of chips)
    for (const p of PRODUCTS[chip.code] ?? []) byId.set(p.id, p);
  return [...byId.values()];
}

/**
 * 2-5e 브랜드 더 보기 목록(`GET /rankings/brands`): 그 종류의 전체 브랜드(「제조 ○○」 포함)와 제품 수.
 * API는 분류 · 찾는 글자(`q`)만 받아 판매처 등 다른 필터를 반영하지 않는다(남은 질문 35)
 */
export function fixtureBrandList(
  code: string | null,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of productsOf(code))
    if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count }));
}

/** 2-5 메모: 브랜드 탭에는 많이 만드는 브랜드 8개까지. 나머지는 「브랜드 더 보기」(2-5e) */
const TOP_BRANDS = 8;

/**
 * 필터 시트 값(`GET /rankings/filters`): 판매처 · 브랜드 · 영양성분마다 제품 수와 지금 고른 조건의 제품 수(「n개 제품 보기」).
 * 서버(`RankingService.filters`)처럼 탭마다의 수는 고른 조건 없이 그 종류 전체로 세고, 「n개 제품 보기」만 고른 조건으로 센다.
 * 브랜드 순서도 서버처럼 제품 수 순(메모의 2025 생산량 순과 다름, 남은 질문 34).
 * 「제조 ○○」 회사는 위 8개에 넣지 않고 전체 수(`totalBrands`)에만 센다.
 * `brands.counts`(위 8개 밖 브랜드의 수)는 API `FilterSheetDto`에 없는 값이다. 「제조 ○○」 빼기 · 순서와 함께 남은 질문 34
 */
export function fixtureFilterSheet(
  code: string | null,
  filters: RankingFilters,
): {
  count: number;
  sellers: Record<Seller, number>;
  nutrients: {
    code: NutrientFilter;
    label: string;
    rule: string;
    count: number;
    hidden: boolean;
  }[];
  brands: {
    top: { name: string; count: number }[];
    totalBrands: number;
    /** 위 8개에 없는 브랜드(2-5e에서 고른 것)의 수를 보일 때 쓴다 */
    counts: Record<string, number>;
  };
} {
  const all = productsOf(code);
  const sellers = {} as Record<Seller, number>;
  for (const p of all)
    for (const s of sellersOf(p.id)) sellers[s] = (sellers[s] ?? 0) + 1;

  const brandCounts = new Map<string, number>();
  for (const p of all)
    if (p.brand) brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
  const top = [...brandCounts]
    .filter(([name]) => !name.startsWith("제조 "))
    .map(([name, count]) => ({ name, count }))
    // Map은 처음 나온 순서를 지키고 sort는 안정 정렬이라 같은 수면 목록에 먼저 나온 브랜드가 앞
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_BRANDS);

  // 서버는 칩마다 수를 다른 조건 없이 세고, 10개 미만이거나 85%를 넘으면 숨긴다. fixture는 제품이 14개뿐이라
  // 그 규칙을 걸면 칩이 모두 숨어 0개인 칩만 숨긴다
  const nutrients = NUTRIENT_CHIPS.map((chip) => {
    const count = all.filter((p) => NUTRIENT_TEST[chip.code](p.per100)).length;
    return { ...chip, count, hidden: count === 0 };
  });

  return {
    count: all.filter((p) => matches(p, filters)).length,
    nutrients,
    sellers,
    brands: {
      top,
      totalBrands: brandCounts.size,
      counts: Object.fromEntries(brandCounts),
    },
  };
}

/**
 * 대분류 하나의 묶음: 순위가 열린 칩마다 점수 높은 순 위 `count`개와 그 칩의 개수 줄(`GET /rankings/overview`).
 * 묶음 순서는 탭 순서이고 (필터에 맞는) 제품이 없는 칩은 뺀다
 */
export function fixtureOverview(
  major: RankingMajor,
  count: number,
  filters: RankingFilters = NO_FILTERS,
): { chip: RankingChip; items: RankedProduct[]; coverage: RankingCoverage }[] {
  return major.chips.flatMap((chip) => {
    const { items, coverage } = fixtureRanking(chip.code, "SCORE", filters);
    return items.length > 0
      ? [{ chip, items: items.slice(0, count), coverage }]
      : [];
  });
}
