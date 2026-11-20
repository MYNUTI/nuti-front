import type { Metadata } from "next";

import { parseRankingGoal } from "@/lib/ranking/format";

import { RankingHome } from "./_components/ranking-home";

export const metadata: Metadata = { title: "랭킹" };

// 2-2 점수 순위(종류를 고르지 않았을 때). 주소 값은 `_components/review.tsx` 참고
export default async function RankingHomePage({
  searchParams,
}: PageProps<"/v3/rankings">) {
  const { sample, goal } = await searchParams;

  return (
    <RankingHome
      query={{
        sample: sample === "1",
        goalParam: typeof goal === "string" ? goal : undefined,
      }}
      goal={parseRankingGoal(goal)}
    />
  );
}
