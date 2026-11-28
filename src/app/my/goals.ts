import type { Goal as ApiGoal } from "@/lib/goal/types";

import type { Goal } from "./_fixtures";

/** 화면 목표 이름(`diet` · `muscle`)과 API 목표 값. 내 목표는 기기 쿠키(`@/lib/goal/device`)에 API 값으로 둔다 */
export const API_GOAL: Record<Goal, ApiGoal> = {
  diet: "WEIGHT_LOSS",
  muscle: "MUSCLE_GAIN",
};

export const SCREEN_GOAL: Record<ApiGoal, Goal> = {
  WEIGHT_LOSS: "diet",
  MUSCLE_GAIN: "muscle",
};

export const GOAL_LABEL: Record<Goal, string> = {
  diet: "다이어트",
  muscle: "근육 증가",
};

/*
 * 목표 카드 2장(5-2 목표 바꾸기 · 5-6c 목표 고르기(가입 중)의 【최종】 문장). 1-5 목표 선택은 근육 증가 설명이 달라
 * `intro/goal/goal-form.tsx`에 따로 있다(UI 플랜 남은 질문 55 「5-2 근육 증가 카드 설명」).
 */
export const GOAL_CARDS = [
  {
    value: "diet",
    title: GOAL_LABEL.diet,
    description: "100g당 칼로리가 낮을수록\n칼로리 항목 점수가 높아요",
    image: "/intro/goal-diet.png",
    size: 1020,
  },
  {
    value: "muscle",
    title: GOAL_LABEL.muscle,
    description: "단백질이 충분하면\n칼로리가 높을수록 좋아요",
    image: "/intro/goal-muscle.png",
    size: 840,
  },
] as const satisfies readonly {
  value: Goal;
  title: string;
  description: string;
  image: string;
  size: number;
}[];
