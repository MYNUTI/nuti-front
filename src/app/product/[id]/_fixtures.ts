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

/** 영양성분 하나. 값은 100g(음료는 100mL)당 숫자로 두고, 1회 제공량 값·1일 기준치 %·평가 말은 화면이 계산한다 */
export type NutrientValue = {
  key:
    | "calories"
    | "protein"
    | "sugar"
    | "saturatedFat"
    | "transFat"
    | "cholesterol"
    | "sodium"
    | "dietaryFiber";
  label: string;
  unit: "kcal" | "g" | "mg";
  /** 표시가 없으면 null */
  per100: number | null;
  /** 1일 영양성분 기준치. 기준치가 없는 성분(트랜스지방)은 null */
  dailyValue: number | null;
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
    /** 음료는 100mL당 */
    unit: "g" | "mL";
    /** 1회 제공량. 없는 제품은 1회 제공량 칩을 숨긴다(디자인 메모) */
    serving: { label: string; amount: number } | null;
    /** 처음부터 보이는 줄 */
    main: NutrientValue[];
    /** 「다른 영양성분 n개 더 보기」로 펼치는 줄 */
    more: NutrientValue[];
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
  // 1일 기준치는 식약처 1일 영양성분 기준치(성인 2,000kcal)
  nutrition: {
    unit: "g",
    serving: { label: "한 개", amount: 40 },
    main: [
      {
        key: "calories",
        label: "칼로리",
        unit: "kcal",
        per100: 413,
        dailyValue: 2000,
      },
      {
        key: "protein",
        label: "단백질",
        unit: "g",
        per100: 37.7,
        dailyValue: 55,
      },
      { key: "sugar", label: "당류", unit: "g", per100: 12.7, dailyValue: 100 },
    ],
    more: [
      {
        key: "saturatedFat",
        label: "포화지방",
        unit: "g",
        per100: 2.7,
        dailyValue: 15,
      },
      {
        key: "transFat",
        label: "트랜스지방",
        unit: "g",
        per100: 0,
        dailyValue: null,
      },
      {
        key: "cholesterol",
        label: "콜레스테롤",
        unit: "mg",
        per100: 10,
        dailyValue: 300,
      },
      {
        key: "sodium",
        label: "나트륨",
        unit: "mg",
        per100: 250,
        dailyValue: 2000,
      },
      {
        key: "dietaryFiber",
        label: "식이섬유",
        unit: "g",
        per100: null,
        dailyValue: 25,
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
    nutrition: { ...DESIGN.nutrition, unit: "mL", serving: null },
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
    nutrition: { ...DESIGN.nutrition, unit: "mL", serving: null },
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
