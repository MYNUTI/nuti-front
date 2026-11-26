"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/common/button";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { TabBar } from "@/components/common/tab-bar";

import {
  fixtureBrandList,
  fixtureFilterSheet,
  fixtureOverview,
  type RankingGoal,
  type RankingMajor,
  type RankingSort,
} from "./_fixtures";
import {
  filterSummary,
  formatCoverage,
  RANKING_GOAL_LABEL,
  rankingHref,
  writeFilterParams,
} from "./format";
import { RankingCategorySheet } from "./ranking-category-sheet";
import { RankingFilterSheet } from "./ranking-filter-sheet";
import {
  CriteriaRow,
  FilterChips,
  GroupCard,
  MidTabs,
  RankingTitleBar,
} from "./ranking-frame";
import { RankRow } from "./ranking-items";
import { useRankingFilters } from "./use-ranking-filters";

// 【최종】 메모: 묶음마다 실제 제품 상위 3개(다이어트 점수 순)
const ROWS_PER_GROUP = 3;

/*
 * 2-2 점수 순위(대분류 전체, 【최종】 ⑥ 9306:17910 · 간편식 예시 18827) — 대분류 하나의 전체 보기.
 * 홈의 대분류 타일, 중분류 탭 「전체」, 2-5f 식품 분류의 「전체」 칩에서 온다.
 * 틀(제목 줄 · 중분류 탭 · 필터 칩)은 중분류 하나와 같고 정렬 버튼은 없다. 중분류끼리는 비교하지 않으므로
 * 묶음마다 1위에서 3위를 따로 매긴다.
 * 필터 적용(【최종】 18735): 묶음마다 필터에 맞는 상위 3개, 맞는 제품이 없는 묶음은 뺀다. 기준 줄 앞에 「쿠팡 제품만,」.
 * 묶음의 「전체 보기」 · 중분류 탭은 같은 필터를 건 채 그 중분류 순위로 간다.
 */
export function RankingMajorAll({
  major,
  goal,
  sort,
  failed,
}: {
  major: RankingMajor;
  goal: RankingGoal;
  /** 이 화면에는 정렬이 없지만 중분류 탭으로 옮길 때 고른 정렬을 잇는다 */
  sort: RankingSort;
  /** 미리 보기 `?state=error` */
  failed: boolean;
}) {
  const router = useRouter();
  const filter = useRankingFilters();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const closeCategory = () => setCategoryOpen(false);
  const { filters } = filter;

  // 걸린 필터를 주소에 남겨 새로 고치거나 상세에서 뒤로 와도 같은 묶음이 열린다(정렬 등 다른 값은 그대로)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    writeFilterParams(params, filters);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, [filters]);

  const groups = fixtureOverview(major, ROWS_PER_GROUP, filters);
  const summary = filterSummary(filters);
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
            onMajorClick={() => setCategoryOpen(true)}
          />
          <MidTabs
            majorCode={major.code}
            chips={major.chips}
            activeCode={major.code}
            hrefFor={hrefFor}
          />
        </header>
        <FilterChips
          filters={filters}
          onFilterClick={filter.open}
          onReset={filter.reset}
          sellerChipRef={filter.sellerChip}
        />
        <CriteriaRow
          lines={[
            `${summary ? `${summary}, ` : ""}${RANKING_GOAL_LABEL[goal]} 목표로 종류마다 상위 ${ROWS_PER_GROUP}개`,
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
          ) : groups.length === 0 && summary && major.chips.length > 0 ? (
            <EmptyState
              // 필터에 맞는 묶음이 하나도 없을 때는 그림이 없어 중분류 순위의 필터 0건과 같게 둔다(남은 질문 33)
              title="고른 조건에 맞는 제품이 없어요"
              description="조건을 바꾸거나 필터를 초기화해 보세요."
              className="rounded-md bg-white"
              actions={
                <Button kind="secondary" size="M" onClick={filter.reset}>
                  필터 초기화
                </Button>
              }
            />
          ) : groups.length === 0 ? (
            <EmptyState
              // 순위가 열린 중분류가 없는 대분류(2-5f는 「전체」를 보이지 않지만 홈 대분류 타일은 메모대로 여기로 온다). 그림이 없어 임시 문장
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
      {categoryOpen && (
        // 열 때마다 새로 붙여 지금 보는 대분류가 펼친 채 열리게 한다
        <RankingCategorySheet
          open
          onOpenChange={(open) => !open && closeCategory()}
          activeCode={major.code}
          hrefFor={hrefFor}
        />
      )}
      {filter.tab && (
        <RankingFilterSheet
          open
          onOpenChange={(open) => !open && filter.close()}
          tab={filter.tab}
          categoryName={major.name}
          applied={filters}
          sheetFor={(draft) => fixtureFilterSheet(major.code, draft)}
          brandList={fixtureBrandList(major.code)}
          onApply={filter.apply}
        />
      )}
    </>
  );
}
