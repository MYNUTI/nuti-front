/*
 * 08단계 없는 제품(3-6 ~ 3-9) 임시 데이터. API 연결 때 제품 결과(`ProductResultResponse`, 상태 `INSUFFICIENT`) ·
 * 같은 종류 순위 조회로 바꾼다.
 */
import type { ScoreBand } from "@/components/common/score-ring";

import type { Goal } from "../product/[id]/_fixtures";

export type SimilarProduct = {
  id: string;
  brand: string;
  name: string;
  image: string | null;
  score: { value: number; band: ScoreBand };
  /** 「100g당 당류 4.3g」. 어느 영양소를 보일지는 그림이 정하지 않았다(남은 질문 42) */
  meta: string;
  href?: string;
};

export type NoScoreProduct = {
  id: string;
  brand: string | null;
  name: string;
  image: string | null;
  /** 3-6 메모 「이럴 땐」: 다른 사람이 먼저 요청 · 이 기기에서 이미 요청 */
  requested: "others" | "mine" | null;
  /** 같은 종류 순위를 매긴 목표(API `appliedGoal`). 기준 줄 「다이어트 목표」 */
  goal: Goal;
  /** 같은 종류에서 점수가 있는 제품(점수 높은 순 3개, 0개면 구역을 숨긴다) */
  similar: SimilarProduct[];
};

// 3-2 fixture와 같은 번호 · 점수 · 사진이라 누르면 그 결과가 열린다
const PROTEIN_BARS: SimilarProduct[] = [
  {
    id: "5",
    brand: "커클랜드 시그니처",
    name: "프로틴바 초콜릿 브라우니",
    image: "/fixtures/product-1.png",
    score: { value: 92, band: 1 },
    meta: "100g당 당류 3.3g",
  },
  {
    id: "11",
    brand: "마이프로틴",
    name: "하이프로틴바 초콜렛 오렌지",
    image: "/fixtures/product-2.png",
    score: { value: 89, band: 1 },
    meta: "100g당 당류 3.9g",
  },
  {
    id: "r9003",
    brand: "마이프로틴",
    name: "하이프로틴바",
    image: "/fixtures/product-2.png",
    score: { value: 87, band: 1 },
    meta: "100g당 당류 4.2g",
    // 3-2 fixture에 없는 제품이라 【최종】 메모(프로토타입에서만)처럼 3-2 디자인 제품으로 잇는다
    href: "/product/4",
  },
];

/** 검색 fixture의 점수 없는 제품(`p1`)과 같은 번호 */
export const FIXTURE_NO_SCORE: Record<string, NoScoreProduct> = {
  p1: {
    id: "p1",
    brand: "올가니카",
    name: "올가니카 올라 츄이프로틴바 베리아몬드",
    image: "/fixtures/product-5.png",
    requested: null,
    goal: "diet",
    similar: PROTEIN_BARS,
  },
};

/*
 * 3-8 사진에서 읽은 값(【최종】 3-8 그림의 값). 사진을 읽는 API가 없어(남은 질문 44) 늘 같은 값을 돌려준다.
 * 미리 보기 주소 값 ?state=total — 총 내용량 기준으로 읽음 · nobasis — 기준을 읽지 못함 · unread — 단백질을 읽지 못함
 */
export type LabelReading = {
  basis: "serving" | "per100g" | "per100ml" | "total" | null;
  amount: { value: string; unit: "g" | "mL" };
  nutrients: Record<
    | "energy"
    | "sodium"
    | "carbohydrate"
    | "sugars"
    | "fat"
    | "transFat"
    | "saturatedFat"
    | "cholesterol"
    | "protein"
    | "fiber",
    string
  >;
  /** 신뢰도가 낮은 칸(「확인 필요」) */
  unsure: string[];
};

export function fixtureReading(state: string | undefined): LabelReading {
  const reading: LabelReading = {
    basis: "serving",
    amount: { value: "40", unit: "g" },
    nutrients: {
      energy: "149",
      sodium: "193",
      carbohydrate: "16.0",
      sugars: "3.4",
      fat: "5.6",
      transFat: "0",
      saturatedFat: "1.2",
      cholesterol: "5",
      protein: "10.3",
      fiber: "4.8",
    },
    unsure: ["sodium"],
  };
  if (state === "total") return { ...reading, basis: "total" };
  if (state === "nobasis") return { ...reading, basis: null, unsure: [] };
  if (state === "unread")
    return { ...reading, nutrients: { ...reading.nutrients, protein: "" } };
  return reading;
}
