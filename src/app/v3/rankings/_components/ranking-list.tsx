"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/common/button";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { IconChevronDown } from "@/components/icons";
import {
  formatCoverage,
  RANKING_GOAL_LABEL,
  RANKING_SORT_OPTIONS,
} from "@/lib/ranking/format";
import { useRanking, useRankingCategories } from "@/lib/ranking/queries";
import type { RankingGoal, RankingSort } from "@/lib/ranking/types";

import {
  FilterChips,
  MidTabs,
  RankingTabBar,
  RankingTitleBar,
} from "./ranking-frame";
import { RankCard, RankCardSkeleton } from "./ranking-items";
import {
  rankingSource,
  reviewHref,
  useNotBuiltNotice,
  type ReviewQuery,
} from "./review";
import { SortSheet } from "./sort-sheet";

const FILTERS = ["판매처", "브랜드", "영양성분"];
const FILTER_SCREEN: Record<string, string> = {
  판매처: "2-5b 필터(판매처)",
  브랜드: "2-5 필터(브랜드)",
  영양성분: "2-5 필터(영양성분)",
};

/*
 * 2-2 점수 순위 — 중분류(칩) 하나의 순위. 정렬 고르기 시트도 이 화면의 상태다.
 * 제목 줄과 중분류 탭은 위에 붙어 있고, 필터 칩 줄과 목록 머리 줄은 목록과 함께 밀려 올라간다.
 * 목록 끝에 닿을 때마다 다음 12개를 이어 불러온다.
 * 데이터: `GET /rankings/categories`(대분류 이름·중분류 탭) + `GET /rankings`(순위).
 */
export function RankingList({
  code,
  query,
  goal,
  initialSort,
}: {
  /** 칩 코드(중분류 4자리 또는 합산 칩) */
  code: string;
  query: ReviewQuery;
  goal?: RankingGoal;
  initialSort: RankingSort;
}) {
  const source = rankingSource(query.sample);
  const notBuilt = useNotBuiltNotice();
  const [sort, setSort] = useState(initialSort);
  const [sortOpen, setSortOpen] = useState(false);

  const categories = useRankingCategories(source);
  const ranking = useRanking({ category: code, goal, sort }, source);
  const page = ranking.data;

  const major = categories.data?.majors.find((m) =>
    m.chips.some((chip) => chip.code === code),
  );
  // 분류를 받기 전이나 받지 못했을 때는 순위 응답에 실려 오는 대분류 이름을 쓴다
  const majorName = major?.name ?? page?.category.majorName ?? null;

  const hrefFor = (chipCode: string, nextSort = sort) =>
    reviewHref(`/v3/rankings/${encodeURIComponent(chipCode)}`, query, nextSort);

  const selectSort = (next: RankingSort) => {
    setSort(next);
    // 고른 정렬을 주소에 남겨 새로 고치거나 주소를 건네도 같은 순서로 열리게 한다. 화면은 다시 받지 않는다
    window.history.replaceState(null, "", hrefFor(code, next));
  };

  // 목록 끝에 닿으면 다음 쪽을 부른다. 끝 표시(sentinel)는 목록이 다시 그려질 때마다 새 요소라 상태로 받아,
  // 요소가 바뀌면 감시도 다시 건다
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const {
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = ranking;
  useEffect(() => {
    // 다시 받는 중에는 부르지 않는다(다음 쪽 요청이 진행 중인 다시 받기를 끊으면 앞쪽과 뒤쪽 순위가 어긋날 수 있다).
    // 다음 쪽이 실패했을 때도 저절로 다시 부르지 않고 아래 「다시 시도」에 맡긴다
    if (!sentinel || !hasNextPage || isFetching || isFetchNextPageError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage({ cancelRefetch: false });
      },
      // 끝에 닿기 조금 전에 미리 부른다
      { rootMargin: "200px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);

  const appliedGoal = page?.goal ?? goal ?? "WEIGHT_LOSS";
  const sortLabel =
    RANKING_SORT_OPTIONS.find((option) => option.sort === sort)?.label ??
    page?.sortLabel;

  return (
    <>
      <main className="flex flex-1 flex-col bg-bg-page pb-[calc(57px+var(--safe-bottom))]">
        <header className="sticky top-0 z-10 bg-bg-page pt-safe">
          <RankingTitleBar
            major={majorName}
            onMajorClick={() => notBuilt.show("2-5f 식품 분류")}
          />
          <MidTabs
            chips={major?.chips ?? []}
            activeCode={code}
            hrefFor={hrefFor}
            onAllClick={() => notBuilt.show("2-2 점수 순위(대분류 전체)")}
          />
        </header>
        <FilterChips
          filters={FILTERS}
          onFilterClick={(name) => notBuilt.show(FILTER_SCREEN[name])}
        />
        <div className="flex h-11 items-center justify-between pr-2 pl-4">
          <div className="flex h-[38px] min-w-0 flex-col gap-0.5 text-[12px]">
            <Link
              href="/my/goal"
              className="self-start leading-5 font-medium whitespace-nowrap text-brand-link"
            >
              목표: {RANKING_GOAL_LABEL[appliedGoal]} ›
            </Link>
            <p className="truncate leading-4 text-text-sub">
              {page ? formatCoverage(page.coverage) : " "}
            </p>
          </div>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setSortOpen(true)}
            className="flex h-11 shrink-0 items-center gap-0.5 pl-2 text-body2-medium text-text-strong"
          >
            {sortLabel}
            <IconChevronDown aria-hidden className="size-4 text-icon-default" />
          </button>
        </div>

        <div className="flex-1 bg-white px-5 pt-1 pb-5">
          {!page ? (
            ranking.isError ? (
              <ErrorState
                // 랭킹의 오류 제목 문장은 상태표에 없다(결정 대기). 다른 화면의 꼴을 따른 임시 문장
                title="순위를 불러오지 못했어요"
                onRetry={() => void ranking.refetch()}
                retryKind="secondary"
              />
            ) : (
              <LoadingState
                skeleton={
                  <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                    {[0, 1, 2, 3].map((card) => (
                      <RankCardSkeleton key={card} />
                    ))}
                  </div>
                }
              />
            )
          ) : page.items.length === 0 ? (
            <EmptyState
              // 필터 없이 0개인 화면은 그림에 없다(순위가 열린 칩은 300개 이상이라 생기지 않는다). 임시 문장
              title="이 종류에 보여 줄 제품이 아직 없어요"
            />
          ) : (
            // 받아 둔 목록이 있으면 다음 쪽이나 다시 받기가 실패해도 목록은 그대로 둔다
            <>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-6">
                {page.items.map((product) => (
                  <li key={product.id} className="min-w-0">
                    <RankCard product={product} />
                  </li>
                ))}
              </ul>
              <div ref={setSentinel} aria-hidden />
              {isFetchingNextPage ? (
                <p
                  role="status"
                  className="py-3 text-center text-[13px] leading-4 text-text-sub"
                >
                  더 불러오는 중
                </p>
              ) : (
                isFetchNextPageError && (
                  // 다음 12개를 받지 못했을 때의 모양은 그림에 없다. 임시 문장
                  <div className="flex flex-col items-center gap-2 pt-5 text-body2 text-text-sub">
                    더 불러오지 못했어요
                    <Button
                      kind="secondary"
                      size="M"
                      onClick={() => void fetchNextPage()}
                    >
                      다시 시도
                    </Button>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>
      <RankingTabBar rankingHref={reviewHref("/v3/rankings", query)} />
      <SortSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        sort={sort}
        onSelect={selectSort}
      />
      {notBuilt.element}
    </>
  );
}
