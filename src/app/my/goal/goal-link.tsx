"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useDeviceGoal } from "@/lib/goal/device";

import type { Goal } from "../_fixtures";
import { GOAL_LABEL, SCREEN_GOAL } from "../goals";
import { goalPickerHref } from "./next-path";

/*
 * 홈 · 검색 결과 · 랭킹의 「목표: ○○ ›」(→ 5-2 목표 바꾸기). 【최종】 5-2 메모대로 바꾼 뒤 이 화면으로 돌아오게
 * 지금 주소를 `next`로 넘긴다. 목표는 기기 목표(`useDeviceGoal`)다. 서버 렌더에서는 쿠키를 읽지 않아 `fallback`으로 그린다
 */
export function GoalLink({
  fallback,
  className,
}: {
  /** 서버 렌더 · 고른 적이 없을 때 보일 목표. 서버가 쿠키로 읽은 목표를 넘기면 그려진 뒤 바뀌지 않는다 */
  fallback: Goal;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deviceGoal = useDeviceGoal();
  const goal: Goal = deviceGoal ? SCREEN_GOAL[deviceGoal] : fallback;
  const query = searchParams.toString();
  return (
    <Link
      href={goalPickerHref(`${pathname}${query ? `?${query}` : ""}`)}
      className={className}
    >
      목표: {GOAL_LABEL[goal]} <span aria-hidden>›</span>
    </Link>
  );
}
