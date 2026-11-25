"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/common/button";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { TabBar } from "@/components/common/tab-bar";

import {
  FIXTURE_MAJORS,
  FIXTURE_UPDATED_AT,
  fixtureBrandList,
  fixtureFilterSheet,
  fixtureOverview,
  NO_FILTERS,
  type RankingGoal,
} from "./_fixtures";
import {
  DEFAULT_RANKING_SORT,
  filterSummary,
  formatUpdatedDate,
  RANKING_GOAL_LABEL,
  rankingHref,
  writeFilterParams,
} from "./format";
import { readLastChip } from "./last-chip";
import {
  CriteriaRow,
  FilterChips,
  GroupCard,
  RankingTitleBar,
} from "./ranking-frame";
import { RankingCategorySheet } from "./ranking-category-sheet";
import { RankingFilterSheet } from "./ranking-filter-sheet";
import { TopRow } from "./ranking-items";
import { useRankingFilters } from "./use-ranking-filters";

// 묶음마다 그 대분류의 중분류 앞 3개에서 1위를 하나씩 보인다
const ROWS_PER_GROUP = 3;

const noSubscribe = () => () => {};

/*
 * 2-2 점수 순위(종류를 고르지 않았을 때, 【최종】 ⑥ 9722:19601) — 하단 탭 「랭킹」을 처음 누르면 여는 화면.
 * 제목 줄(「랭킹」 + 고르지 않은 「종류」 버튼 + 검색), 필터 칩 3개, 머리 줄, 대분류 묶음 목록.
 * 【최종】 메모: 탭을 다시 누르면 마지막에 본 중분류(2-2 점수 순위)로 간다.
 * 필터 적용(【최종】 「판매처 쿠팡」 9722:19856 — 홈 「판매처별로 보기」 · 「쿠팡에서 살 수 있는 제품 전체」에서 온다):
 * 대분류마다 필터에 맞는 제품이 있는 중분류 앞 3개에서 1위, 그런 중분류가 없는 묶음은 뺀다. 기준 줄 앞에 「쿠팡 제품만,」.
 * `review/v3-rankings`의 `ranking-home.tsx`를 옮기고 데이터를 fixture로 바꿨다.
 */
export function RankingHome({
  goal,
  failed,
  noneOpen,
}: {
  goal: RankingGoal;
  /** 미리 보기 `?state=error` */
  failed: boolean;
  /** 미리 보기 `?state=empty` — 순위가 열린 종류가 하나도 없을 때 */
  noneOpen: boolean;
}) {
  const router = useRouter();
  // 표시는 라우터의 현재 주소에서 읽는다. 서버가 넘긴 값은 뒤로 와서 다시 붙을 때 처음 받아 둔 것이 오고,
  // window.location은 화면을 옮기는 중에는 아직 이전 주소다
  const searchParams = useSearchParams();
  const fromTab = searchParams.get("from") === "tab";
  const filter = useRankingFilters();
  const { filters } = filter;
  // 홈 「종류 전체 보기」(`?sheet=category`)로 오면 시트를 연 채 연다(【최종】 2-5f 메모)
  const [categoryOpen, setCategoryOpen] = useState(
    () => searchParams.get("sheet") === "category",
  );
  const majorButton = useRef<HTMLButtonElement>(null);
  // 닫으면 주소의 표시를 지워 새로 고치거나 뒤로 와도 다시 열리지 않게 한다
  const closeCategory = () => {
    setCategoryOpen(false);
    const params = new URLSearchParams(window.location.search);
    if (!params.has("sheet")) return;
    // 저절로 열린 시트는 누른 버튼이 없어 닫으면 포커스가 맨 앞으로 간다. 시트가 포커스를 돌려준 뒤 「종류」 버튼으로 옮긴다
    requestAnimationFrame(() => majorButton.current?.focus());
    params.delete("sheet");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  };
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

  // 걸린 필터를 주소에 남겨 새로 고치거나 상세에서 뒤로 와도 같은 묶음이 열린다(다른 값은 그대로)
  useEffect(() => {
    // 마지막 칩으로 옮기는 중에 replaceState를 부르면 Next가 되돌리기로 받아 대기 중인 router.replace를 버린다
    if (last) return;
    const params = new URLSearchParams(window.location.search);
    writeFilterParams(params, filters);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, [last, filters]);

  if (last)
    return (
      <>
        <main className="flex-1 bg-bg-page" />
        <TabBar />
      </>
    );

  // 중분류에 (필터에 맞는) 점수 있는 제품이 없으면 그 줄을 빼고, 줄이 하나도 없는 묶음은 뺀다
  const groupsFor = (f: typeof filters) =>
    noneOpen
      ? []
      : FIXTURE_MAJORS.map((major) => ({
          major,
          rows: fixtureOverview(major, 1, f).slice(0, ROWS_PER_GROUP),
        })).filter((g) => g.rows.length > 0);
  const groups = groupsFor(filters);
  const summary = filterSummary(filters);
  const updated = formatUpdatedDate(FIXTURE_UPDATED_AT);

  // 순위가 열린 종류가 하나도 없을 때(필터 때문에 비면 아래 필터 0건)
  if (!failed && (summary ? groupsFor(NO_FILTERS) : groups).length === 0)
    return <NoneOpen />;

  return (
    <>
      <main className="flex flex-1 flex-col bg-bg-page pb-[calc(57px+var(--safe-bottom))]">
        <header className="sticky top-0 z-10 bg-bg-page pt-safe">
          <RankingTitleBar
            major={null}
            onMajorClick={() => setCategoryOpen(true)}
            majorButtonRef={majorButton}
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
            `${summary ? `${summary}, ` : ""}${RANKING_GOAL_LABEL[goal]} 목표로 종류마다 1위`,
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
              // 필터에 맞는 묶음이 없을 때는 그림이 없어 중분류 순위의 필터 0건과 같게 둔다(남은 질문 33)
              title="고른 조건에 맞는 제품이 없어요"
              description="조건을 바꾸거나 필터를 초기화해 보세요."
              className="rounded-md bg-white"
              actions={
                <Button kind="secondary" size="M" onClick={filter.reset}>
                  필터 초기화
                </Button>
              }
            />
          ) : (
            groups.map(({ major, rows }) => (
              <GroupCard
                key={major.code}
                id={`major-${major.code}`}
                title={major.name}
                // 걸린 필터 그대로 대분류 전체(필터 적용)로
                moreHref={rankingHref(major.code, {
                  sort: DEFAULT_RANKING_SORT,
                  goal,
                  filters,
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
      {categoryOpen && (
        // 열 때마다 새로 붙여 지금 보는 대분류가 펼친 채 열리게 한다
        <RankingCategorySheet
          open
          onOpenChange={(open) => !open && closeCategory()}
          activeCode={null}
          hrefFor={(code) =>
            rankingHref(code, { sort: DEFAULT_RANKING_SORT, goal, filters })
          }
        />
      )}
      {filter.tab && (
        <RankingFilterSheet
          open
          onOpenChange={(open) => !open && filter.close()}
          tab={filter.tab}
          // 종류를 고르지 않아 2-5e 「○○ 브랜드, 가나다순」의 ○○는 「모든 종류」(그림 없음, 남은 질문 38)
          categoryName="모든 종류"
          applied={filters}
          sheetFor={(draft) => fixtureFilterSheet(null, draft)}
          brandList={fixtureBrandList(null)}
          onApply={filter.apply}
        />
      )}
    </>
  );
}

/*
 * 2-2 점수 순위(순위가 열린 종류가 없을 때, 【최종】 ⑥ 9846:19146) — 분석 완료 제품이 300개 이상인 종류가 없을 때
 * (출시 직후 등). 제목 줄은 「랭킹」 + 검색만, 종류 버튼 · 필터 칩 · 기준 줄 없이 회색 면 가운데 빈 화면.
 * 「바코드 찍기」는 3-1로 가고, 카메라 권한 안내(0-3)는 3-1이 맡는다.
 */
function NoneOpen() {
  return (
    <>
      <main className="flex flex-1 flex-col bg-bg-page pb-[calc(57px+var(--safe-bottom))]">
        <header className="sticky top-0 z-10 bg-bg-page pt-safe">
          <RankingTitleBar major={null} />
        </header>
        <div className="flex-1 bg-bg-band px-5 pt-12 pb-5">
          <EmptyState
            title="아직 순위가 열린 종류가 없어요"
            description={
              "제품 이름으로 찾거나 바코드를 찍어\n점수를 볼 수 있어요."
            }
            actions={
              <>
                {/* 탭 화면이지만 【최종】 그림은 검정 주 버튼이다. 목록이 없어 이 버튼이 화면의 주 행동이라 secondary로 낮추지 않는다 */}
                <Button kind="primary" size="M" asChild>
                  <Link href="/search">이름으로 찾기</Link>
                </Button>
                <Button kind="tertiary" size="M" asChild>
                  <Link href="/scan">바코드 찍기</Link>
                </Button>
              </>
            }
          />
        </div>
      </main>
      <TabBar />
    </>
  );
}
