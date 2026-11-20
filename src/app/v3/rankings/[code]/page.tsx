import type { Metadata } from "next";

import { parseRankingGoal, parseRankingSort } from "@/lib/ranking/format";

import { RankingList } from "../_components/ranking-list";

export const metadata: Metadata = { title: "랭킹" };

// 2-2 점수 순위(중분류 하나) + 정렬 고르기 시트. 주소 값은 `_components/review.tsx` 참고
export default async function RankingListPage({
  params,
  searchParams,
}: PageProps<"/v3/rankings/[code]">) {
  const { code } = await params;
  const { sample, goal, sort } = await searchParams;

  return (
    <RankingList
      // 다른 중분류로 옮기면 화면 상태(열린 시트 등)를 새로 시작한다. 고른 정렬은 주소로 넘어온다
      key={code}
      code={code}
      query={{
        sample: sample === "1",
        goalParam: typeof goal === "string" ? goal : undefined,
      }}
      goal={parseRankingGoal(goal)}
      initialSort={parseRankingSort(sort)}
    />
  );
}
