"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { TabBar } from "@/components/common/tab-bar";

import {
  FIXTURE_MAJORS,
  FIXTURE_UPDATED_AT,
  fixtureOverview,
  type RankingGoal,
} from "./_fixtures";
import { formatUpdatedDate, RANKING_GOAL_LABEL } from "./format";
import { readLastChip } from "./last-chip";
import {
  FilterChips,
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
 * 【최종】 메모: 다시 열면 마지막에 본 중분류(2-2 점수 순위)로 간다.
 * `review/v3-rankings`의 `ranking-home.tsx`를 옮기고 데이터를 fixture로 바꿨다.
 */
export function RankingHome({
  goal,
  failed,
  resume,
}: {
  goal: RankingGoal;
  /** 미리 보기 `?state=error` */
  failed: boolean;
  /** 주소 값 없이 열었을 때(하단 탭 「랭킹」)만 마지막에 본 중분류로 이어 간다 */
  resume: boolean;
}) {
  const router = useRouter();
  const notBuilt = useNotBuiltNotice();
  // 서버 그림에는 저장소가 없어 null. 브라우저에서 바로 열 때는 처음부터 읽어 목록이 잠깐 보이지 않게 한다
  const last = useSyncExternalStore(
    noSubscribe,
    () => (resume ? readLastChip() : null),
    () => null,
  );

  useEffect(() => {
    if (last) router.replace(`/ranking/${encodeURIComponent(last)}`);
  }, [last, router]);

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
    rows: fixtureOverview(major).slice(0, ROWS_PER_GROUP),
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
        <div className="flex items-center gap-2 px-4 pt-1.5 pb-2.5 text-[12px] leading-4">
          <p className="min-w-0 flex-1 text-text-sub">
            {RANKING_GOAL_LABEL[goal]} 목표로 종류마다 1위
            {updated && (
              <>
                <br />
                {updated} 업데이트
              </>
            )}
          </p>
          <Link
            href="/grade-guide"
            className="shrink-0 font-medium whitespace-nowrap text-brand-link"
          >
            점수 기준 보기 <span aria-hidden>›</span>
          </Link>
        </div>

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
              <section
                key={major.code}
                aria-labelledby={`major-${major.code}`}
                className="flex flex-col gap-1.5 rounded-md bg-white px-3.5 pt-3 pb-2"
              >
                <div className="flex items-center">
                  <h2
                    id={`major-${major.code}`}
                    className="min-w-0 flex-1 truncate text-[16px] leading-[19px] font-bold text-text-strong"
                  >
                    {major.name}
                  </h2>
                  <button
                    type="button"
                    className="shrink-0 text-[13px] leading-4 font-medium text-brand-link"
                    onClick={() => notBuilt.show("2-2 점수 순위(대분류 전체)")}
                  >
                    전체 보기
                    <span className="sr-only">: {major.name}</span>{" "}
                    <span aria-hidden>›</span>
                  </button>
                </div>
                {rows.map(({ chip, product }) => (
                  <TopRow
                    key={chip.code}
                    chipName={chip.name}
                    product={product}
                  />
                ))}
              </section>
            ))
          )}
        </div>
      </main>
      <TabBar />
      {notBuilt.element}
    </>
  );
}
