"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { Goal } from "../_fixtures";
import { GOAL_LABEL } from "../goals";
import { goalPickerHref } from "./next-path";

/*
 * 홈 · 검색 결과 · 랭킹의 「목표: ○○ ›」(→ 5-2 목표 바꾸기). 【최종】 5-2 메모대로 바꾼 뒤 이 화면으로 돌아오게
 * 지금 주소를 `next`로 넘긴다. 목표는 기기 저장소 · API가 생기기 전까지 주소 `?goal=`이 정하고, 없으면 그 화면의 기본값
 */
export function GoalLink({
  fallback,
  className,
}: {
  /** 주소에 목표가 없을 때(fixture) */
  fallback: Goal;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("goal");
  const goal: Goal =
    fromUrl === "diet" || fromUrl === "muscle" ? fromUrl : fallback;
  const query = searchParams.toString();
  return (
    <Link
      href={goalPickerHref(goal, `${pathname}${query ? `?${query}` : ""}`)}
      className={className}
    >
      목표: {GOAL_LABEL[goal]} <span aria-hidden>›</span>
    </Link>
  );
}
