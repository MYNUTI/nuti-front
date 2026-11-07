/*
 * 3-2 제품 결과 임시 데이터. API 연결 전까지 쓰고, 연결할 때 상세 조회(getProductDetail)·이유 조회 결과를
 * 이 모양으로 바꾸는 mapper로 바꾼다(UI 플랜 「데이터」).
 * "4"는 디자인 3-2 화면 값 그대로, "1"·"2"는 스캔 목 조회(lib/mock-catalog.ts)와 같은 상품이라 스캔에서 「자세히 보기」로 와도 열린다.
 * "3"은 「더 맞는 제품」 칼만스 카드가 404가 되지 않게 카드와 같은 이름·사진·점수로 둔다.
 * 순위는 API에 없다(인수인계 백엔드 질문 8).
 */
import type { ProductCardItem } from "@/components/common/product-card";
import type { ScoreBand } from "@/components/common/score-ring";

export type Goal = "diet" | "muscle";

export type NutrientRow = {
  label: string;
  /** 「413kcal」 */
  amount: string;
  /** 「많은 편 (1일 기준치의 21%)」 같은 아래 줄 */
  note: string;
  /** 1일 기준치 대비 %. 기준치가 없거나 표시가 없으면 null이고 막대를 그리지 않는다 */
  percent: number | null;
};

export type ProductResult = {
  id: string;
  brand: string | null;
  /** 「프로틴바·간식」 */
  category: string;
  name: string;
  image: { src: string; size: number } | null;
  score: number;
  band: ScoreBand;
  rank: { position: number; total: number } | null;
  goal: Goal;
  reasons: { good: string[]; bad: string[] };
  nutrition: {
    /** 「100g당」 */
    basis: string;
    /** 한 개 용량이 기준 양과 다를 때만. 「한 개(40g)는 165kcal」 */
    serving: string | null;
    /** 처음부터 보이는 줄 */
    main: NutrientRow[];
    /** 「다른 영양성분 n개 더 보기」로 펼치는 줄 */
    more: NutrientRow[];
  };
  better: ProductCardItem[];
  /** 쿠팡 상품 주소. 없으면 쿠팡 버튼·고지를 뺀다 */
  coupangUrl: string | null;
};

const BETTER: ProductCardItem[] = [
  {
    id: "1",
    brand: "커클랜드 시그니처",
    name: "프로틴바 초콜릿 브라우니",
    image: "/fixtures/product-1.png",
    imageSize: 800,
    score: 92,
    band: 1,
    tags: [
      { label: "고포화지방", warn: true },
      { label: "고단백" },
      { label: "저당" },
    ],
  },
  {
    id: "2",
    brand: "마이프로틴",
    name: "하이프로틴바 초콜렛 오렌지",
    image: "/fixtures/product-2.png",
    imageSize: 400,
    score: 89,
    band: 1,
    tags: [{ label: "고단백" }, { label: "저당" }],
  },
  {
    id: "3",
    brand: "칼만스",
    name: "프로틴바 솔티드 다크초코&아몬드",
    image: "/fixtures/product-3.png",
    imageSize: 400,
    score: 86,
    band: 1,
    tags: [{ label: "고단백" }],
  },
];

const DESIGN: ProductResult = {
  id: "4",
  brand: "미트리",
  category: "프로틴바·간식",
  name: "카카오초코 프로틴바",
  image: { src: "/fixtures/product-4.png", size: 600 },
  score: 62,
  band: 3,
  rank: { position: 12, total: 48 },
  goal: "diet",
  reasons: {
    good: ["단백질이 많아요"],
    bad: ["칼로리가 높은 편이에요", "식이섬유 표시가 없어요"],
  },
  nutrition: {
    basis: "100g당",
    serving: "한 개(40g)는 165kcal",
    main: [
      {
        label: "칼로리",
        amount: "413kcal",
        note: "많은 편 (1일 기준치의 21%)",
        percent: 21,
      },
      {
        label: "단백질",
        amount: "37.7g",
        note: "많은 편 (1일 기준치의 69%)",
        percent: 69,
      },
      {
        label: "당류",
        amount: "12.7g",
        note: "보통 (1일 기준치의 13%)",
        percent: 13,
      },
    ],
    more: [
      {
        label: "포화지방",
        amount: "2.7g",
        note: "보통 (1일 기준치의 18%)",
        percent: 18,
      },
      {
        label: "트랜스지방",
        amount: "0g",
        note: "1일 기준치가 없는 성분이에요",
        percent: null,
      },
      {
        label: "콜레스테롤",
        amount: "10mg",
        note: "적은 편 (1일 기준치의 3%)",
        percent: 3,
      },
      {
        label: "나트륨",
        amount: "250mg",
        note: "보통 (1일 기준치의 13%)",
        percent: 13,
      },
      {
        label: "식이섬유",
        amount: "표시 없음",
        note: "표시가 없어 0으로 계산했어요",
        percent: null,
      },
    ],
  },
  better: BETTER,
  coupangUrl: "https://www.coupang.com/",
};

export const FIXTURE_PRODUCTS: Record<string, ProductResult> = {
  // 스캔 목 조회와 같은 상품. 이름·점수는 스캔 시트와 맞추고 나머지는 디자인 값을 빌려 쓴다
  "1": {
    ...DESIGN,
    id: "1",
    brand: null,
    category: "음료",
    name: "더단백 라떼 350ml",
    image: null,
    score: 34,
    band: 4,
    rank: null,
  },
  "2": {
    ...DESIGN,
    id: "2",
    brand: null,
    category: "음료",
    name: "잇더핏 프로틴 190ml",
    image: null,
    score: 88,
    band: 1,
  },
  "3": {
    ...DESIGN,
    id: "3",
    brand: "칼만스",
    name: "프로틴바 솔티드 다크초코&아몬드",
    image: { src: "/fixtures/product-3.png", size: 400 },
    score: 86,
    band: 1,
    rank: null,
  },
  "4": DESIGN,
};
