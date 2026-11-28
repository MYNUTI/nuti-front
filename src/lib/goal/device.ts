import { useSyncExternalStore } from "react";
import {
  ANONYMOUS_ID_MAX_AGE_SECONDS,
  deleteCookie,
  readCookie,
  writeCookie,
} from "@/lib/api/identity";
import { DEVICE_GOAL_COOKIE, isGoal } from "@/lib/goal/device-cookie";
import type { Goal } from "@/lib/goal/types";

/*
 * 내 목표는 기기 쿠키(`device-cookie.ts`)에 둔다. 서버는 로그인하고 「목표 계정 저장」에 동의한 계정만
 * 목표를 저장하고, 결과는 두 목표 점수를 함께 줘 기기가 이 값으로 고른다
 */

// 쿠키를 쓸 수 없는 브라우저에서는 이번 사용 동안만 기억한다(ONB_004 「기기 저장이 막힘」)
let memoryGoal: Goal | null = null;

const listeners = new Set<() => void>();

/** 고른 적이 없으면 null. 화면은 다이어트 기준으로 보이고 「내 목표 고르기」를 둔다(ONB_008) */
export function readDeviceGoal(): Goal | null {
  const stored = readCookie(DEVICE_GOAL_COOKIE);
  return isGoal(stored) ? stored : memoryGoal;
}

export function saveDeviceGoal(goal: Goal) {
  writeCookie(DEVICE_GOAL_COOKIE, goal, ANONYMOUS_ID_MAX_AGE_SECONDS);
  // 쿠키에 써졌으면 메모리에 두지 않는다. 두면 다른 탭의 탈퇴나 브라우저가 쿠키를 지운 것을 가린다
  memoryGoal = readCookie(DEVICE_GOAL_COOKIE) === goal ? null : goal;
  listeners.forEach((listener) => listener());
}

/** 계정 삭제 뒤 처음 방문 상태로 돌린다(ACCT_008). 로그아웃·동의 철회 때는 지우지 않는다 */
export function clearDeviceGoal() {
  memoryGoal = null;
  deleteCookie(DEVICE_GOAL_COOKIE);
  listeners.forEach((listener) => listener());
}

function subscribeDeviceGoal(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 서버 렌더에서는 쿠키를 읽지 않아 null로 그리고, 브라우저에서 다시 읽는다 */
export function useDeviceGoal(): Goal | null {
  return useSyncExternalStore(subscribeDeviceGoal, readDeviceGoal, () => null);
}
