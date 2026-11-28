/*
 * 3-2 제품 결과 · 3-4 더 맞는 제품의 화면 모델. 상품 API(`@/lib/product`)의 결과를 `to-screen.ts`가 이 모양으로 바꾼다.
 * 검색 · 기록 · 비교 화면의 임시 데이터(`_fixtures.ts`)는 아직 v3 전 모양이라 그 화면들을 연결할 때까지 따로 둔다.
 */
import type { ProductCardItem } from "@/components/common/product-card";
import type { ScoreBand } from "@/components/common/score-ring";
import type { NutrientCode } from "@/lib/product/types";

export type Goal = "diet" | "muscle";

/** 한 기준(100g당 · 1회 제공량)의 값. 1일 기준치 % · 적은 편/보통/많은 편은 서버가 계산한다 */
export type NutrientAmount = {
  /** 표시가 없으면 null */
  value: number | null;
  /** 1일 기준치가 없는 성분(트랜스지방 등)은 null */
  dvPercent: number | null;
  levelLabel: string | null;
};

export type NutrientValue = {
  key: NutrientCode;
  label: string;
  unit: string;
  per100: NutrientAmount;
  /** 1회 제공량 값이 없으면 null */
  perServing: NutrientAmount | null;
};

/** 목표마다 달라지는 값 */
export type GoalView = {
  score: number;
  band: ScoreBand;
  /** 같은 종류 중 순위. API에 없어 늘 null(API 플랜 「API가 없는 값」) */
  rank: { position: number; total: number } | null;
  reasons: { good: string[]; bad: string[] };
};

export type ProductResult = {
  id: string;
  brand: string | null;
  /** 「프로틴바·간식」. 분류가 없으면 빈 문자열 */
  category: string;
  /** 그 분류의 코드(API `category.code`). 「같은 종류 순위 보기」가 그 순위(`/ranking/[code]`)로 간다 */
  categoryCode: string | null;
  name: string;
  image: { src: string; size: number } | null;
  score: number;
  band: ScoreBand;
  rank: { position: number; total: number } | null;
  /** 내 목표. 점수·순위·이유는 이 목표 기준이다 */
  goal: Goal;
  /** 내 몸에 맞추기(5-7)를 켰으면 그 하루 칼로리. 다이어트 등급만 이 칼로리로 계산한다(3-2 내 몸에 맞춤) */
  bodyFitKcal: number | null;
  /** 환자용 균형영양식(이름 아래 「환자용 식품이에요」) */
  patientFood?: boolean;
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
    /** 「영양성분 자세히 보기」로 펼치는 줄 */
    more: NutrientValue[];
  };
  better: BetterItem[];
  /** 생산 중단·단종. label은 받은 상태 글자 그대로(「단종」·「생산 중단 · 재고 판매 중」). 판매 중이면 null */
  production: { label: string } | null;
  /**
   * 쿠팡 상품 주소. 없으면 쿠팡 버튼·고지를 뺀다(【최종】: 쿠팡 링크가 없으면 단종으로 본다).
   * 품절이면 제품 이름으로 찾은 쿠팡 검색 결과(제휴) 주소
   */
  coupangUrl: string | null;
  /** 쿠팡 품절(3-2 쿠팡 상품이 품절일 때). 가격 줄을 빼고 버튼이 「쿠팡에서 찾아보기」가 된다 */
  coupangSoldOut?: boolean;
  /** 이름 아래 가격 줄(3-2 기본 · 묶음 상품만 이어졌을 때). 없으면 줄을 뺀다 */
  coupangPrice?: CoupangPrice | null;
  /** 즐겨찾기에 넣었는지 */
  saved: boolean;
};

/**
 * 쿠팡 판매가. date는 판매가를 받은 날(새 값을 못 받으면 서버가 직전 값과 그날 날짜를 준다 — 【최종】 메모).
 * 묶음 상품만 이어졌으면 bundle(개수)과 1개당 값, 상품명에서 개수 · 용량을 못 읽으면 otherSize(가격 · 날짜 없이 「다른 용량」만).
 * API는 아직 묶음 · 다른 용량을 주지 않아 single만 온다
 */
export type CoupangPrice =
  | { kind: "single"; amount: number; date: string }
  | { kind: "bundle"; count: number; unitAmount: number; date: string }
  | { kind: "otherSize" };

/** 더 맞는 제품 하나. diff는 지금 제품과 100g당 값을 비교해 가장 나아진 성분 두 개(API `items[].diffs`) */
export type BetterItem = ProductCardItem & { diff: string };
