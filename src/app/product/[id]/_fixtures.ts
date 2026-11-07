/*
 * 3-2 제품 결과 임시 데이터. API 연결 전까지 쓰고, 연결할 때 상세 조회(getProductDetail)·이유 조회 결과를
 * 이 모양으로 바꾸는 mapper로 바꾼다(UI 플랜 「데이터」).
 * "4"는 디자인 3-2 화면 값 그대로, "1"·"2"는 스캔 목 조회(lib/mock-catalog.ts)와 같은 상품이라 스캔에서 「자세히 보기」로 와도 열린다.
 * "3"은 「더 맞는 제품」 칼만스 카드가 404가 되지 않게 카드와 같은 이름·사진·점수로 둔다.
 * "5"는 디자인 「더 맞는 제품이 없을 때」 값 그대로(커클랜드 카드도 이 주소로 연다).
 * "6"은 디자인 「생산 중단」(재고 판매 중), "7"은 단종(쿠팡 버튼 없음), "8"·"9"는 「내 몸에 맞춤」(다이어트·근육 증가 목표), "10"은 「쿠팡 상품이 없을 때」.
 * 상태 확인용: "1"은 더 맞는 제품이 없는 C~E 등급·사진 없음, "2"는 아쉬운 점이 없는 제품·사진 주소가 깨진 제품.
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

/** 목표마다 달라지는 값 */
export type GoalView = {
  score: number;
  band: ScoreBand;
  rank: { position: number; total: number } | null;
  reasons: { good: string[]; bad: string[] };
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
  /** 내 목표. 점수·순위·이유는 이 목표 기준이다 */
  goal: Goal;
  /**
   * 내 몸에 맞추기(5-7)를 켰으면 그 하루 칼로리. 다이어트 등급만 이 칼로리로 계산한다(3-2 내 몸에 맞춤).
   * 목표처럼 사용자 값이지만 화면이 한 모양으로 받도록 여기 둔다
   */
  bodyFitKcal: number | null;
  reasons: { good: string[]; bad: string[] };
  /** 다른 목표로 미리 볼 때의 점수·순위·이유(3-2 다른 목표로 보기) */
  preview: Partial<Record<Goal, GoalView>>;
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
  /**
   * 생산 중단·단종. label은 받은 상태 글자 그대로(「단종」·「생산 중단 · 재고 판매 중」), 재고가 없으면(단종) 쿠팡 버튼을 뺀다.
   * 판매 중이면 null. API에 아직 이 값이 없다(인수인계 백엔드 질문 10)
   */
  production: { label: string; inStock: boolean } | null;
  /** 쿠팡 상품 주소. 없으면 쿠팡 버튼·고지를 뺀다 */
  coupangUrl: string | null;
};

const BETTER: ProductCardItem[] = [
  {
    id: "5",
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
  bodyFitKcal: null,
  reasons: {
    good: ["단백질이 많아요"],
    bad: ["칼로리가 높은 편이에요", "식이섬유 표시가 없어요"],
  },
  // 디자인 「3-2 다른 목표로 보기」 값
  preview: {
    muscle: {
      score: 85,
      band: 1,
      rank: { position: 6, total: 48 },
      reasons: {
        good: ["단백질이 많아요", "칼로리가 충분해요"],
        bad: ["식이섬유 표시가 없어요"],
      },
    },
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
  production: null,
  coupangUrl: "https://www.coupang.com/",
};

// 디자인 「더 맞는 제품이 없을 때」·「쿠팡 상품이 없을 때」의 커클랜드
const KIRKLAND: ProductResult = {
  id: "5",
  brand: "커클랜드 시그니처",
  category: "프로틴바·간식",
  name: "프로틴바 초콜릿 브라우니",
  image: { src: "/fixtures/product-1.png", size: 800 },
  score: 92,
  band: 1,
  rank: { position: 1, total: 48 },
  goal: "diet",
  bodyFitKcal: null,
  reasons: {
    good: ["식이섬유가 많아요", "당류가 적어요"],
    bad: ["포화지방이 많은 편이에요"],
  },
  // 디자인에 근육 증가로 보기 칩만 있고 값은 없어 임시 값
  preview: {
    muscle: {
      score: 88,
      band: 1,
      rank: null,
      reasons: {
        good: ["단백질이 많아요", "당류가 적어요"],
        bad: ["포화지방이 많은 편이에요"],
      },
    },
  },
  nutrition: {
    unit: "g",
    serving: { label: "한 개", amount: 60 },
    main: [
      {
        key: "calories",
        label: "칼로리",
        unit: "kcal",
        per100: 317,
        dailyValue: 2000,
      },
      {
        key: "protein",
        label: "단백질",
        unit: "g",
        per100: 35,
        dailyValue: 55,
      },
      {
        key: "sugar",
        label: "당류",
        unit: "g",
        per100: 3.3,
        dailyValue: 100,
      },
    ],
    // 디자인의 숨은 줄 값. 식이섬유는 「25.0g · 30%」가 서로 맞지 않아 30%에 맞춘 7.5g로 둔다
    more: [
      {
        key: "saturatedFat",
        label: "포화지방",
        unit: "g",
        per100: 4.3,
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
        per100: 233,
        dailyValue: 2000,
      },
      {
        key: "dietaryFiber",
        label: "식이섬유",
        unit: "g",
        per100: 7.5,
        dailyValue: 25,
      },
    ],
  },
  better: [],
  production: null,
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
    // 순위가 없는 상품이라 미리 보기에서도 순위를 빼 디자인 상품 값이 새지 않게 한다
    preview: {
      muscle: { ...DESIGN.preview.muscle!, rank: null },
    },
    better: [],
  },
  "2": {
    ...DESIGN,
    id: "2",
    brand: null,
    category: "음료",
    name: "잇더핏 프로틴 190ml",
    nutrition: { ...DESIGN.nutrition, unit: "mL", serving: null },
    // 일부러 없는 파일. 사진 주소가 깨졌을 때 그림으로 바뀌는지 본다
    image: { src: "/fixtures/missing.png", size: 400 },
    score: 88,
    band: 1,
    reasons: { good: ["단백질이 많아요", "당류가 적어요"], bad: [] },
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
    // 순위가 없는 상품이라 미리 보기에서도 순위를 빼 디자인 상품 값이 새지 않게 한다
    preview: {
      muscle: { ...DESIGN.preview.muscle!, rank: null },
    },
  },
  "4": DESIGN,
  "5": KIRKLAND,
  "6": {
    ...DESIGN,
    id: "6",
    production: { label: "생산 중단 · 재고 판매 중", inStock: true },
  },
  "7": {
    ...DESIGN,
    id: "7",
    production: { label: "단종", inStock: false },
  },
  // 디자인 「내 몸에 맞춤」(다이어트 목표). 등급·문장은 자리 표시용이라 디자인 상품 값 그대로
  "8": { ...DESIGN, id: "8", bodyFitKcal: 2680 },
  // 근육 증가 목표 + 내 몸에 맞추기. 다이어트로 미리 볼 때만 내 몸에 맞춘 값이다
  "9": {
    ...DESIGN,
    id: "9",
    goal: "muscle",
    bodyFitKcal: 2680,
    ...DESIGN.preview.muscle!,
    preview: {
      diet: {
        score: DESIGN.score,
        band: DESIGN.band,
        rank: DESIGN.rank,
        reasons: DESIGN.reasons,
      },
    },
  },
  // 디자인 「쿠팡 상품이 없을 때」(A 등급, 더 맞는 제품 없음)
  "10": { ...KIRKLAND, id: "10", coupangUrl: null },
};
