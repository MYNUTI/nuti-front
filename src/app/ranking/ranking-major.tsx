"use client";

import { useRouter } from "next/navigation";

import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { TabBar } from "@/components/common/tab-bar";

import {
  fixtureOverview,
  type RankingFilters,
  type RankingGoal,
  type RankingMajor,
  type RankingSort,
} from "./_fixtures";
import {
  FILTER_TAB_SCREEN,
  formatCoverage,
  RANKING_GOAL_LABEL,
  rankingHref,
} from "./format";
import {
  CriteriaRow,
  FilterChips,
  GroupCard,
  MidTabs,
  RankingTitleBar,
  useNotBuiltNotice,
} from "./ranking-frame";
import { RankRow } from "./ranking-items";

// 【최종】 메모: 묶음마다 실제 제품 상위 3개(다이어트 점수 순)
const ROWS_PER_GROUP = 3;

/*
 * 2-2 점수 순위(대분류 전체, 【최종】 ⑥ 9306:17910 · 간편식 예시 18827) — 대분류 하나의 전체 보기.
 * 홈의 대분류 타일, 중분류 탭 「전체」, 2-5f 식품 분류의 「전체」 칩에서 온다.
 * 틀(제목 줄 · 중분류 탭 · 필터 칩)은 중분류 하나와 같고 정렬 버튼은 없다. 중분류끼리는 비교하지 않으므로
 * 묶음마다 1위에서 3위를 따로 매긴다.
 */
export function RankingMajorAll({
  major,
  goal,
  sort,
  filters,
  failed,
}: {
  major: RankingMajor;
  goal: RankingGoal;
  /** 이 화면에는 정렬이 없지만 중분류 탭으로 옮길 때 고른 정렬을 잇는다 */
  sort: RankingSort;
  /** 이 화면은 아직 필터를 걸지 않지만(07단계 뒤 순서) 중분류 탭으로 옮길 때 고른 필터를 잇는다 */
  filters: RankingFilters;
  /** 미리 보기 `?state=error` */
  failed: boolean;
}) {
  const router = useRouter();
  const notBuilt = useNotBuiltNotice();

  const groups = fixtureOverview(major, ROWS_PER_GROUP);
  // API(`GET /rankings/overview`)는 칩마다 개수만 준다. 대분류 개수는 임시로 칩 합 + 첫 묶음 날짜(남은 질문 31)
  const coverage = {
    total: groups.reduce((n, g) => n + g.coverage.total, 0),
    analyzed: groups.reduce((n, g) => n + g.coverage.analyzed, 0),
    updatedAt: groups[0]?.coverage.updatedAt ?? null,
  };
  const hrefFor = (code: string) => rankingHref(code, { sort, goal, filters });

  return (
    <>
      <main className="flex flex-1 flex-col bg-bg-page pb-[calc(57px+var(--safe-bottom))]">
        <header className="sticky top-0 z-10 bg-bg-page pt-safe">
          <RankingTitleBar
            major={major.name}
            onMajorClick={() => notBuilt.show("2-5f 식품 분류")}
          />
          <MidTabs
            majorCode={major.code}
            chips={major.chips}
            activeCode={major.code}
            hrefFor={hrefFor}
          />
        </header>
        <FilterChips
          onFilterClick={(tab) => notBuilt.show(FILTER_TAB_SCREEN[tab])}
        />
        <CriteriaRow
          lines={[
            `${RANKING_GOAL_LABEL[goal]} 목표로 종류마다 상위 ${ROWS_PER_GROUP}개`,
            groups.length > 0 ? formatCoverage(coverage) : null,
          ]}
        />

        <div className="flex flex-1 flex-col gap-2.5 bg-bg-band px-4 pt-1 pb-4">
          {failed ? (
            <ErrorState
              title="순위를 불러오지 못했어요"
              onRetry={() => router.refresh()}
              retryKind="secondary"
              className="rounded-md bg-white"
            />
          ) : groups.length === 0 ? (
            <EmptyState
              // 순위가 열린 중분류가 없는 대분류는 2-5f에서 고를 수 없어 그림이 없다. 임시 문장
              title="이 종류는 아직 순위가 열리지 않았어요"
              description="점수 있는 제품이 충분히 모이면 순위가 열려요."
              className="rounded-md bg-white"
            />
          ) : (
            groups.map(({ chip, items }) => (
              <GroupCard
                key={chip.code}
                id={`chip-${chip.code}`}
                title={chip.name}
                moreHref={hrefFor(chip.code)}
              >
                <ul className="flex flex-col gap-1.5">
                  {items.map((product) => (
                    <li key={product.id}>
                      <RankRow product={product} />
                    </li>
                  ))}
                </ul>
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
