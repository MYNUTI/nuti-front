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
  per100: { calories: number; protein: number; sugar: number };
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
      "씨알푸드",
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
  ],
  "0202": [
    sample("r9202", "CJ", "햇반100%현미밥130G(3입)", 72, 2, [LOW_SUGAR], {
      calories: 150,
      protein: 3,
      sugar: 0.2,
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

/** 중분류 하나의 순위(`GET /rankings` 여러 쪽을 합친 모양). 순위는 그 정렬에서의 자리 */
export function fixtureRanking(
  chipCode: string,
  sort: RankingSort,
): { items: RankedProduct[]; coverage: RankingCoverage } {
  const products = PRODUCTS[chipCode] ?? [];
  const key = SORT_KEY[sort];
  const text = SORT_TEXT[sort];
  const items = products
    .map((p, index) => ({ p, index }))
    .sort((a, b) => key(a.p) - key(b.p) || a.index - b.index)
    .map(({ p }, i) => {
      const { per100, ...rest } = p;
      return { ...rest, rank: i + 1, sortText: text ? text(per100) : null };
    });
  // 프로틴바 · 간식만 점수 없는 제품이 하나 더 있는 것으로 둬 「n개 중 m개 점수 있음」 꼴을 보인다
  const analyzed = products.length;
  const total = chipCode === "01S4" ? analyzed + 1 : analyzed;
  return { items, coverage: { total, analyzed, updatedAt: UPDATED_AT } };
}

/** 대분류 하나의 묶음: 순위가 열린 칩마다 1위(`GET /rankings/overview`). 제품이 없는 칩은 뺀다 */
export function fixtureOverview(
  major: RankingMajor,
): { chip: RankingChip; product: RankedProduct }[] {
  return major.chips.flatMap((chip) => {
    const top = fixtureRanking(chip.code, "SCORE").items[0];
    return top ? [{ chip, product: top }] : [];
  });
}
