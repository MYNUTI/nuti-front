import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findMajor, majorOf } from "../_fixtures";
import {
  parseRankingGoal,
  parseRankingShown,
  parseRankingSort,
} from "../format";
import { RankingList } from "../ranking-list";
import { RankingMajorAll } from "../ranking-major";

export async function generateMetadata({
  params,
}: PageProps<"/ranking/[code]">): Promise<Metadata> {
  const { code } = await params;
  const name =
    findMajor(code)?.name ??
    majorOf(code)?.chips.find((c) => c.code === code)?.name;
  return { title: name ? `${name} 랭킹` : "랭킹" };
}

/*
 * 2-2 점수 순위. `code`가 대분류 코드(2자리)면 대분류 전체, 칩 코드면 중분류 하나 + 정렬 고르기 시트
 * (API도 필터 시트의 `category`에 둘 다 받는다).
 * 주소 값: ?sort= — 고른 정렬(기본은 적지 않음. 대분류 전체는 탭을 옮길 때 잇기만 한다),
 * ?n= — 불러온 개수(12개 넘게 불러왔을 때만. 상세에서 뒤로 오면 되살린다),
 * ?goal=muscle · ?state=error — 미리 보기
 */
export default async function RankingCodePage({
  params,
  searchParams,
}: PageProps<"/ranking/[code]">) {
  const { code } = await params;
  const { goal, sort, n, state } = await searchParams;

  const major = findMajor(code);
  if (major)
    return (
      <RankingMajorAll
        major={major}
        goal={parseRankingGoal(goal)}
        sort={parseRankingSort(sort)}
        failed={state === "error"}
      />
    );

  // 순위가 열리지 않았거나 없는 칩(API는 404 `RANKING_NOT_OPEN` · `RESOURCE_NOT_FOUND`)
  if (!majorOf(code)) notFound();
  return (
    <RankingList
      // 다른 중분류로 옮기면 화면 상태(열린 시트 · 불러온 개수)를 새로 시작한다. 고른 정렬은 주소로 넘어온다
      key={code}
      code={code}
      goal={parseRankingGoal(goal)}
      initialSort={parseRankingSort(sort)}
      initialShown={parseRankingShown(n)}
      failed={state === "error"}
    />
  );
}
