import type { Metadata } from "next";

import { RankingHome } from "./ranking-home";
import { parseRankingGoal } from "./format";

export const metadata: Metadata = { title: "랭킹" };

/*
 * 2-2 점수 순위(종류를 고르지 않았을 때). 주소 값 없이 열면(하단 탭 「랭킹」) 마지막에 본 중분류가 있을 때
 * 그 순위(`/ranking/[code]`)로 간다. 주소 값이 있으면 그 값으로 연 것이라 이어 보지 않는다.
 * API 연결 전 미리보기용 주소 값: ?goal=muscle — 근육 증가 목표, ?state=error — 「순위를 불러오지 못했어요」
 */
export default async function RankingPage({
  searchParams,
}: PageProps<"/ranking">) {
  const query = await searchParams;
  return (
    <RankingHome
      goal={parseRankingGoal(query.goal)}
      failed={query.state === "error"}
      resume={Object.keys(query).length === 0}
    />
  );
}
