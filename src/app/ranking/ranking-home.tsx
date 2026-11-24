"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { TabBar } from "@/components/common/tab-bar";

import {
  FIXTURE_MAJORS,
  FIXTURE_UPDATED_AT,
  fixtureOverview,
  type RankingGoal,
} from "./_fixtures";
import {
  DEFAULT_RANKING_SORT,
  formatUpdatedDate,
  RANKING_GOAL_LABEL,
  rankingHref,
} from "./format";
import { readLastChip } from "./last-chip";
import {
  CriteriaRow,
  FilterChips,
  GroupCard,
  RankingTitleBar,
  useNotBuiltNotice,
} from "./ranking-frame";
import { TopRow } from "./ranking-items";

// 묶음마다 그 대분류의 중분류 앞 3개에서 1위를 하나씩 보인다
const ROWS_PER_GROUP = 3;

const noSubscribe = () => () => {};

/*
 * 2-2 점수 순위(종류를 고르지 않았을 때, 【최종】 ⑥ 9722:19601) — 하단 탭 「랭킹」을 처음 누르면 여는 화면.
 * 제목 줄(「랭킹」 + 고르지 않은 「종류」 버튼 + 검색), 필터 칩 3개, 머리 줄, 대분류 묶음 목록.
 * 【최종】 메모: 탭을 다시 누르면 마지막에 본 중분류(2-2 점수 순위)로 간다.
 * `review/v3-rankings`의 `ranking-home.tsx`를 옮기고 데이터를 fixture로 바꿨다.
 */
export function RankingHome({
  goal,
  failed,
}: {
  goal: RankingGoal;
  /** 미리 보기 `?state=error` */
  failed: boolean;
}) {
  const router = useRouter();
  const notBuilt = useNotBuiltNotice();
  // 표시는 라우터의 현재 주소에서 읽는다. 서버가 넘긴 값은 뒤로 와서 다시 붙을 때 처음 받아 둔 것이 오고,
  // window.location은 화면을 옮기는 중에는 아직 이전 주소다
  const searchParams = useSearchParams();
  const fromTab = searchParams.get("from") === "tab";
  // 서버 그림에는 저장소가 없어 null. 브라우저에서 바로 열 때는 처음부터 읽어 목록이 잠깐 보이지 않게 한다
  const last = useSyncExternalStore(
    noSubscribe,
    () => (fromTab ? readLastChip() : null),
    () => null,
  );

  useEffect(() => {
    if (last) {
      router.replace(`/ranking/${encodeURIComponent(last)}`);
      return;
    }
    // 이어 볼 곳이 없으면 표시를 지워, 다른 화면에 갔다가 뒤로 왔을 때 이어 보기가 걸리지 않게 한다
    if (!fromTab) return;
    const params = new URLSearchParams(searchParams);
    params.delete("from");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `/ranking${query ? `?${query}` : ""}`,
    );
  }, [last, fromTab, searchParams, router]);

  if (last)
    return (
      <>
        <main className="flex-1 bg-bg-page" />
        <TabBar />
      </>
    );

  // 중분류에 점수 있는 제품이 없으면 그 줄을 빼고, 줄이 하나도 없는 묶음은 뺀다
  const groups = FIXTURE_MAJORS.map((major) => ({
    major,
    rows: fixtureOverview(major, 1).slice(0, ROWS_PER_GROUP),
  })).filter((g) => g.rows.length > 0);
  const updated = formatUpdatedDate(FIXTURE_UPDATED_AT);

  return (
    <>
      <main className="flex flex-1 flex-col bg-bg-page pb-[calc(57px+var(--safe-bottom))]">
        <header className="sticky top-0 z-10 bg-bg-page pt-safe">
          <RankingTitleBar
            major={null}
            onMajorClick={() => notBuilt.show("2-5f 식품 분류")}
          />
        </header>
        <FilterChips onFilterClick={notBuilt.show} />
        <CriteriaRow
          lines={[
            `${RANKING_GOAL_LABEL[goal]} 목표로 종류마다 1위`,
            updated && `${updated} 업데이트`,
          ]}
        />

        <div className="flex flex-1 flex-col gap-2.5 bg-bg-band px-4 pt-1 pb-4">
          {failed ? (
            <ErrorState
              // 랭킹의 오류 제목은 【최종】 2-2 메모(「순위를 불러오지 못했어요」)
              title="순위를 불러오지 못했어요"
              onRetry={() => router.refresh()}
              retryKind="secondary"
              className="rounded-md bg-white"
            />
          ) : groups.length === 0 ? (
            <EmptyState
              // 【최종】 메모는 「순위가 열린 종류가 없을 때」 화면으로 보낸다(그림은 이 단계 뒤에 대조). 임시 문장
              title="아직 순위가 열린 종류가 없어요"
              description="종류마다 점수 있는 제품이 충분히 모이면 순위가 열려요."
              className="rounded-md bg-white"
            />
          ) : (
            groups.map(({ major, rows }) => (
              <GroupCard
                key={major.code}
                id={`major-${major.code}`}
                title={major.name}
                moreHref={rankingHref(major.code, {
                  sort: DEFAULT_RANKING_SORT,
                  goal,
                })}
              >
                {rows.map(({ chip, items }) => (
                  <TopRow
                    key={chip.code}
                    chipName={chip.name}
                    product={items[0]}
                  />
                ))}
              </GroupCard>
            ))
          )}
        </div>
      </main>
      <TabBar />
      {notBuilt.element}
    </>
  );
}
