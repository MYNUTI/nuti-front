import "server-only";
import { cookies } from "next/headers";
import { DEVICE_GOAL_COOKIE, isGoal } from "@/lib/goal/device-cookie";
import type { Goal } from "@/lib/goal/types";

/** 서버 렌더에서 기기 목표 쿠키를 읽는다. 고른 적이 없으면 null(화면은 다이어트 기준, ONB_008) */
export async function readServerDeviceGoal(): Promise<Goal | null> {
  const value = (await cookies()).get(DEVICE_GOAL_COOKIE)?.value;
  return isGoal(value) ? value : null;
}
