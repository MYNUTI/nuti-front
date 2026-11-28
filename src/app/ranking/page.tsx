import type { Metadata } from "next";

import { RankingHome } from "./ranking-home";
import { readServerDeviceGoal } from "@/lib/goal/device.server";

export const metadata: Metadata = { title: "랭킹" };

/*
 * 2-2 점수 순위(종류를 고르지 않았을 때). 하단 탭 「랭킹」(?from=tab)으로 열면 마지막에 본 중분류가 있을 때
 * 그 순위(`/ranking/[code]`)로 간다. 그 밖(뒤로 가기 · 다른 화면의 링크)은 이 화면을 그대로 보인다.
 * 목표는 기기 목표(쿠키), 고른 적이 없으면 다이어트(ONB_008).
 * API 연결 전 미리보기용 주소 값: ?state=error — 「순위를 불러오지 못했어요」,
 * ?state=empty — 순위가 열린 종류가 없을 때
 */
export default async function RankingPage({
  searchParams,
}: PageProps<"/ranking">) {
  const { state } = await searchParams;
  return (
    <RankingHome
      goal={(await readServerDeviceGoal()) ?? "WEIGHT_LOSS"}
      failed={state === "error"}
      noneOpen={state === "empty"}
    />
  );
}
