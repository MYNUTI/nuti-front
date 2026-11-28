import type { Goal } from "@/lib/goal/types";

/*
 * 기기 목표 쿠키의 이름과 값 검사. 서버 렌더(`device.server.ts`)와 브라우저(`device.ts`)가 함께 쓴다.
 * `device.ts`는 React 훅(`useDeviceGoal`)을 담아 서버 컴포넌트가 불러올 수 없어 따로 둔다
 */

/**
 * 내 목표는 기기에 둔다(v3 기능명세 ONB_004 · ACCT_002). 서버 렌더도 같은 값을 읽도록 localStorage가 아니라 쿠키에 둔다
 */
export const DEVICE_GOAL_COOKIE = "nuti_goal";

export function isGoal(value: unknown): value is Goal {
  return value === "WEIGHT_LOSS" || value === "MUSCLE_GAIN";
}
