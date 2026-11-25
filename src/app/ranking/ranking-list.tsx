"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { SortSheet } from "@/components/common/sort-sheet";
import { TabBar } from "@/components/common/tab-bar";
import { Toast } from "@/components/common/toast";
import { CompareBar } from "@/components/compare/compare-bar";
import { useCompare } from "@/components/compare/compare-store";
import { IconChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

import {
  fixtureBrandList,
  fixtureFilterSheet,
  fixtureRanking,
  majorOf,
  type RankingGoal,
  type RankingSort,
} from "./_fixtures";
import {
  formatCoverage,
  hasFilters,
  parseRankingShown,
  parseRankingSort,
  RANKING_GOAL_LABEL,
  RANKING_PAGE_SIZE as PAGE_SIZE,
  RANKING_SORT_OPTIONS,
  rankingHref,
  writeFilterParams,
} from "./format";
import { writeLastChip } from "./last-chip";
import { RankingCategorySheet } from "./ranking-category-sheet";
import { RankingFilterSheet } from "./ranking-filter-sheet";
import { useRankingFilters } from "./use-ranking-filters";
import { FilterChips, MidTabs, RankingTitleBar } from "./ranking-frame";
import { RankCard } from "./ranking-items";

// fixture는 바로 오지만 「더 불러오는 중」을 보이려고 잠깐 기다린다(API 연결 때 지운다)
const FIXTURE_LOAD_MS = 400;

/*
 * 2-2 점수 순위(【최종】 ⑥ 9306:17575) — 중분류(칩) 하나의 순위. 정렬 고르기 시트(19130)도 이 화면의 상태다.
 * 제목 줄과 중분류 탭은 위에 붙어 있고, 필터 칩 줄과 목록 머리 줄은 목록과 함께 밀려 올라간다.
 * 비교함에 1개 이상 담겨 있으면 하단 탭 위에 비교함 바(3-4와 같은 모양).
 * `review/v3-rankings`의 `ranking-list.tsx`를 옮기고 데이터를 fixture로 바꿨다.
 */
export function RankingList({
  code,
  goal,
  failed,
}: {
  /** 칩 코드(중분류 4자리 또는 합산 칩) */
  code: string;
  goal: RankingGoal;
  /** 미리 보기 `?state=error` */
  failed: boolean;
}) {
  const router = useRouter();
  // 뒤로 와서 다시 붙을 때는 Next가 처음 받아 둔 화면(라우터 캐시)의 값이 넘어오고, window.location은 화면을 옮기는 중엔
  // 아직 이전 주소라 라우터의 지금 주소에서 읽는다. 서버 그림은 같은 주소의 서버 값과 같다
  const searchParams = useSearchParams();
  const [restored] = useState(() => ({
    sort: parseRankingSort(searchParams.get("sort") ?? undefined),
    shown: parseRankingShown(searchParams.get("n") ?? undefined),
  }));
  const [sort, setSort] = useState<RankingSort>(restored.sort);
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const closeCategory = () => setCategoryOpen(false);
  const [shown, setShown] = useState(restored.shown);
  const filter = useRankingFilters(() => setShown(PAGE_SIZE));
  const { filters } = filter;
  const [loadingMore, setLoadingMore] = useState(false);
  const [tooFew, setTooFew] = useState(0);
  const compare = useCompare();
  // 하단 탭(57) 위 비교함 바. 탭의 스캔 버튼이 24 솟아 있어 바 아래 여백을 24 두고 그 자리에 버튼이 겹치게 한다
  // (【최종】 메모: 3-4와 같은 모양 · 2-2 그림 없음). 바 높이 = 57 + 24
  const barHeight = compare.length > 0 ? 81 : 0;
  // 알림은 비교함 바가 있으면 바 위 12
  const aboveBar =
    barHeight > 0
      ? "bottom-[calc(57px+81px+12px+var(--safe-bottom))]"
      : undefined;
  const sentinel = useRef<HTMLDivElement>(null);

  const major = majorOf(code);
  const { items, coverage } = fixtureRanking(code, sort, filters);
  const filtered = hasFilters(filters);
  const hasMore = shown < items.length;

  useEffect(() => writeLastChip(code), [code]);

  // 정렬 · 필터 · 불러온 개수를 주소에 남겨 새로 고치거나 상세에서 뒤로 와도 같은 목록이 열린다.
  // 기록은 쌓지 않고, 다른 주소 값(목표 · 미리 보기)은 그대로 둔다
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (sort !== "SCORE") params.set("sort", sort);
    else params.delete("sort");
    writeFilterParams(params, filters);
    if (shown > PAGE_SIZE) params.set("n", String(shown));
    else params.delete("n");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, [sort, filters, shown]);

  // 【최종】 메모: 정렬 · 고른 필터는 중분류 탭을 옮겨도 유지하고 랭킹을 새로 열면 기본으로
  const hrefFor = (chipCode: string) =>
    rankingHref(chipCode, { sort, goal, filters });

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setLoadingMore(true);
      },
      // 끝에 닿기 조금 전에 미리 부른다
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  useEffect(() => {
    if (!loadingMore) return;
    const timer = setTimeout(() => {
      setShown((n) => n + PAGE_SIZE);
      setLoadingMore(false);
    }, FIXTURE_LOAD_MS);
    return () => clearTimeout(timer);
  }, [loadingMore]);

  const sortLabel = RANKING_SORT_OPTIONS.find((o) => o.value === sort)!.label;

  return (
    <>
      <main
        className="flex flex-1 flex-col bg-bg-page"
        style={{
          paddingBottom: `calc(${57 + barHeight}px + var(--safe-bottom))`,
        }}
      >
        <header className="sticky top-0 z-10 bg-bg-page pt-safe">
          <RankingTitleBar
            major={major?.name ?? null}
            onMajorClick={() => setCategoryOpen(true)}
          />
          {major && (
            <MidTabs
              majorCode={major.code}
              chips={major.chips}
              activeCode={code}
              hrefFor={(tabCode) => hrefFor(tabCode)}
            />
          )}
        </header>
        <FilterChips
          filters={filters}
          onFilterClick={filter.open}
          onReset={filter.reset}
          sellerChipRef={filter.sellerChip}
        />
        <div className="flex h-11 items-center justify-between pr-2 pl-4">
          <div className="flex h-[38px] min-w-0 flex-col gap-0.5 text-[12px]">
            <Link
              href="/my/goal"
              className="self-start leading-5 font-medium whitespace-nowrap text-brand-link"
            >
              목표: {RANKING_GOAL_LABEL[goal]} <span aria-hidden>›</span>
            </Link>
            <p className="truncate leading-4 text-text-sub">
              {formatCoverage(coverage)}
            </p>
          </div>
          {/* v3/SortButton: 글자 14 · 꺾쇠 16 · 누르는 높이 44 */}
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setSortOpen(true)}
            className="flex h-11 shrink-0 items-center gap-0.5 pl-2 text-body2-medium text-text-strong"
          >
            <span className="sr-only">정렬: </span>
            {sortLabel}
            <IconChevronDown aria-hidden className="size-4 text-icon-default" />
          </button>
        </div>

        <div className="flex-1 bg-white px-5 pt-1 pb-5">
          {failed ? (
            <ErrorState
              title="순위를 불러오지 못했어요"
              onRetry={() => router.refresh()}
              retryKind="secondary"
            />
          ) : items.length === 0 ? (
            filtered ? (
              <EmptyState
                // 【최종】 메모의 「2-2 점수 순위(필터 0건)」는 그림이 없다. 임시 문장 · 버튼(남은 질문 33)
                title="고른 조건에 맞는 제품이 없어요"
                description="조건을 바꾸거나 필터를 초기화해 보세요."
                actions={
                  <Button kind="secondary" size="M" onClick={filter.reset}>
                    필터 초기화
                  </Button>
                }
              />
            ) : (
              <EmptyState
                // 필터 없이 0개인 화면은 그림에 없다(순위가 열린 칩은 300개 이상이라 생기지 않는다). 임시 문장
                title="이 종류에 보여 줄 제품이 아직 없어요"
              />
            )
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-6">
                {items.slice(0, shown).map((product) => (
                  <li key={product.id} className="min-w-0">
                    <RankCard product={product} />
                  </li>
                ))}
              </ul>
              {hasMore && <div ref={sentinel} aria-hidden />}
              {/* 영역이 먼저 있어야 읽으므로 늘 두고 글자만 바꾼다 */}
              <p
                role="status"
                className={cn(
                  "text-center text-[13px] leading-4 text-text-sub",
                  loadingMore && "py-3",
                )}
              >
                {loadingMore ? "더 불러오는 중" : ""}
              </p>
              {/* 목록 끝 여백(【최종】 「내려 볼 때」의 여백 43). 마지막 줄이 가운데 솟은 스캔 버튼에 가리지 않게 한다 */}
              <div aria-hidden className="h-[43px]" />
            </>
          )}
        </div>
      </main>
      {compare.length > 0 && (
        <CompareBar
          items={compare}
          onTooFew={() => setTooFew((n) => n + 1)}
          // 하단 탭이 뒤에 그려져 솟은 스캔 버튼이 바 위에 보이도록 바를 탭보다 아래 층에 둔다
          className="bottom-[calc(57px+var(--safe-bottom))] z-0 pb-6"
        />
      )}
      <TabBar />
      <SortSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        options={RANKING_SORT_OPTIONS}
        value={sort}
        onSelect={(next) => {
          setSort(next);
          setShown(PAGE_SIZE);
        }}
      />
      {categoryOpen && (
        // 열 때마다 새로 붙여 지금 보는 대분류가 펼친 채 열리게 한다
        <RankingCategorySheet
          open
          onOpenChange={(open) => !open && closeCategory()}
          activeCode={code}
          hrefFor={hrefFor}
        />
      )}
      {filter.tab && (
        // 열 때마다 새로 붙여 시트 안의 고른 것이 지금 걸린 필터에서 시작하게 한다
        <RankingFilterSheet
          open
          onOpenChange={(open) => !open && filter.close()}
          tab={filter.tab}
          categoryName={
            major?.chips.find((chip) => chip.code === code)?.name ?? ""
          }
          applied={filters}
          sheetFor={(draft) => fixtureFilterSheet(code, draft)}
          brandList={fixtureBrandList(code)}
          onApply={filter.apply}
        />
      )}
      {tooFew > 0 && (
        <Toast
          key={tooFew}
          message="비교하려면 하나 더 담아 주세요"
          className={aboveBar}
        />
      )}
    </>
  );
}
