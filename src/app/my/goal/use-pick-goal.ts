"use client";

import { saveDeviceGoal } from "@/lib/goal/device";
import { useChangeGoal } from "@/lib/goal/queries";
import { logEvent } from "@/lib/logging/track";

import type { Goal } from "../_fixtures";
import { API_GOAL } from "../goals";

/**
 * 1-5 · 5-2 · 5-1(되돌리기)에서 내 목표를 고르거나 바꾼다. 기기에 저장하고, 동의한 로그인 계정이면 계정에도 저장한다
 * (`useChangeGoal`). 이벤트 `goal_set(from_screen)`을 남긴다. 이벤트 명세(LOG_002)는 목표 값도 넣으라고 하지만 ONB_004는
 * 건강 목표를 동의 없이 서버로 보내지 않는다고 해, 확인받기 전까지 목표 값은 싣지 않는다(API 플랜 「남은 질문」).
 * 고른 뒤 바로 다른 화면으로 가는데, `mutate`의 저장은 다음 틱에 돌아 이동한 화면의 서버 렌더가 쿠키를 읽기 전일 수 있다.
 * 그래서 기기 쿠키를 먼저 바로 쓴다(`mutate`가 한 번 더 써도 같은 값이다)
 */
export function usePickGoal(screen: string) {
  const changeGoal = useChangeGoal();
  /** fromScreen은 들어온 화면 코드(`2-1` · `5-1` 등) */
  return (to: Goal, fromScreen: string) => {
    const goal = API_GOAL[to];
    saveDeviceGoal(goal);
    changeGoal.mutate(goal);
    logEvent("goal_set", { screen, props: { from_screen: fromScreen } });
  };
}
