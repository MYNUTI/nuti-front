"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { SortSheet } from "@/components/common/sort-sheet";
import { TabBar } from "@/components/common/tab-bar";
import { Toast } from "@/components/common/toast";
import { CompareBar } from "@/components/compare/compare-bar";
import { useCompare } from "@/components/compare/compare-store";
import { IconChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

import {
  fixtureRanking,
  majorOf,
  type RankingGoal,
  type RankingSort,
} from "./_fixtures";
import {
  formatCoverage,
  parseRankingShown,
  parseRankingSort,
  RANKING_GOAL_LABEL,
  RANKING_PAGE_SIZE as PAGE_SIZE,
  RANKING_SORT_OPTIONS,
  rankingHref,
} from "./format";
import { writeLastChip } from "./last-chip";
import {
  FilterChips,
  MidTabs,
  RankingTitleBar,
  useNotBuiltNotice,
} from "./ranking-frame";
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
  initialSort,
  initialShown,
  failed,
}: {
  /** 칩 코드(중분류 4자리 또는 합산 칩) */
  code: string;
  goal: RankingGoal;
  initialSort: RankingSort;
  initialShown: number;
  /** 미리 보기 `?state=error` */
  failed: boolean;
}) {
  const router = useRouter();
  // 뒤로 와서 다시 붙을 때는 Next가 처음 받아 둔 화면(라우터 캐시)의 값이 넘어오므로 브라우저 주소를 먼저 읽는다
  const [restored] = useState(() => {
    if (typeof window === "undefined")
      return { sort: initialSort, shown: initialShown };
    const params = new URLSearchParams(window.location.search);
    return {
      sort: parseRankingSort(params.get("sort") ?? undefined),
      shown: parseRankingShown(params.get("n") ?? undefined),
    };
  });
  const [sort, setSort] = useState<RankingSort>(restored.sort);
  const [sortOpen, setSortOpen] = useState(false);
  const [shown, setShown] = useState(restored.shown);
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
  const notBuilt = useNotBuiltNotice(aboveBar);
  const sentinel = useRef<HTMLDivElement>(null);

  const major = majorOf(code);
  const { items, coverage } = fixtureRanking(code, sort);
  const hasMore = shown < items.length;

  useEffect(() => writeLastChip(code), [code]);

  // 불러온 개수를 주소에 남겨 상세에서 뒤로 와도 같은 자리까지 보인다. 다른 주소 값(미리 보기)은 그대로 둔다
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (shown > PAGE_SIZE) params.set("n", String(shown));
    else params.delete("n");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, [shown]);

  // 정렬을 주소에 남겨 새로 고치거나 뒤로 와도 같은 순서로 열린다. 기록은 쌓지 않는다
  // (【최종】 메모: 중분류 탭을 옮겨도 유지하고 랭킹을 새로 열면 기본으로)
  const hrefFor = (chipCode: string, nextSort = sort) =>
    rankingHref(chipCode, { sort: nextSort, goal });

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
            onMajorClick={() => notBuilt.show("2-5f 식품 분류")}
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
        <FilterChips onFilterClick={notBuilt.show} />
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
            <EmptyState
              // 필터 없이 0개인 화면은 그림에 없다(순위가 열린 칩은 300개 이상이라 생기지 않는다). 임시 문장
              title="이 종류에 보여 줄 제품이 아직 없어요"
            />
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
          window.history.replaceState(null, "", hrefFor(code, next));
        }}
      />
      {tooFew > 0 && (
        <Toast
          key={tooFew}
          message="비교하려면 하나 더 담아 주세요"
          className={aboveBar}
        />
      )}
      {notBuilt.element}
    </>
  );
}
