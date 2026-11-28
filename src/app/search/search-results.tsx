"use client";

import Link from "next/link";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { GoalLink } from "@/app/my/goal/goal-link";
import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/common/empty-state";
import { ProductCard } from "@/components/common/product-card";
import { SortSheet } from "@/components/common/sort-sheet";
import { IconChevronDown } from "@/components/icons";
import { toCardInput } from "@/app/to-card";
import { SCREEN_GOAL } from "@/app/my/goals";
import { useDeviceGoal } from "@/lib/goal/device";
import type { Goal } from "@/lib/goal/types";
import { logSearch } from "@/lib/logging/track";
import type { ProductCardData } from "@/lib/product/types";
import { searchQueries } from "@/lib/search/queries";
import { cn } from "@/lib/utils";

import { particleWa } from "./hangul";
import { isSearchable, PAGE_SIZE, readResultParams } from "./result-params";
import { settleSearchLog, shouldLogSearch } from "./search-log";
import { API_SORT, SEARCH_SORTS, type SearchSort } from "./sorts";

/*
 * 2-4 검색 결과(【최종】 ⑥ 9306:17425 · 사진이 없는 제품이 섞일 때 17730 · 내려 볼 때 19410).
 * 세로로 내리며 12개씩 더 불러오는 3열 카드 격자 한 목록(묶음 없음). 맨 위 「검색 결과 n개」 · 「○○ 순위 보기 ›」,
 * 그 아래 「목표: 다이어트 ›」(→ 5-2) · 정렬 버튼(→ 정렬 시트). 점수 없는 제품은 맨 뒤, 회색 「점수 없음」(→ 3-6).
 * 검색어가 제품 이름 전체와 같으면 그 제품을 맨 위 한 칸에 따로 둔다.
 * 「찾는 제품이 없나요?」 바는 아래로 내리면 올라오고 위로 올리면 숨는다.
 * 오른쪽 세로 스크롤 표시는 브라우저 기본(내리는 동안 보임)을 쓴다(【최종】 메모: 늘 보이게 할지는 개발에서 정함).
 * 데이터는 `GET /search`(무한 조회, 12개씩). 이름이 같은 제품은 `pinned`, 순위 링크는 서버가 준 `category`(검색어가
 * 중분류 이름과 같을 때만)로 그린다. 검색 로그는 `search-log.ts`가 정한 때(검색해 왔거나 페이지를 처음 열었을 때)
 * 첫 결과를 받으면 한 번 보낸다(인기 검색어가 이 로그로 모인다). 글자 · 숫자가 없는 말은 서버가 거절해 부르지 않고 0건으로 보인다.
 * 다음 페이지를 못 불러오면 불러 둔 목록은 두고 끝 줄에 「더 불러오지 못했어요 · 다시 시도」(그린 화면 없음, API 플랜 「남은 질문」).
 */
export function SearchResults({
  query,
  initialSort,
  initialShown,
  active,
  failed,
  goal: serverGoal,
  onSearch,
}: {
  query: string;
  /** 주소의 `&sort=` · `&n=`. 상세에서 뒤로 오면 정렬 · 불러온 개수를 되살린다 */
  initialSort: SearchSort;
  initialShown: number;
  /** 결과가 보이는 중인지(검색칸을 누르면 숨긴 채로 남겨 정렬 · 개수를 지킨다) */
  active: boolean;
  /** 미리 보기 `?state=error` — 공통 「불러오지 못했어요」 */
  failed: boolean;
  /** 서버가 기기 쿠키로 읽은 내 목표. 브라우저에서는 기기 목표(`useDeviceGoal`)를 따른다 */
  goal: Goal;
  /** 2-4b 「이렇게 찾아볼까요?」 칩으로 다시 찾는다(최근 검색어에도 남긴다) */
  onSearch: (word: string) => void;
}) {
  const router = useRouter();
  // 【최종】 메모: 새 검색어를 치면 기본 정렬로(이 부품은 검색어마다 새로 붙는다). 같은 검색어면 지킨다.
  // 뒤로 와서 다시 붙을 때는 Next가 처음 받아 둔 화면(라우터 캐시)의 값이 넘어오므로 브라우저 주소를 먼저 읽는다
  const [restored] = useState(() =>
    typeof window === "undefined"
      ? { sort: initialSort, shown: initialShown }
      : readResultParams((name) =>
          new URLSearchParams(window.location.search).get(name),
        ),
  );
  const [sort, setSort] = useState<SearchSort>(restored.sort);
  const [sortOpen, setSortOpen] = useState(false);
  // 상세에서 뒤로 왔는데 캐시가 없으면 주소의 개수(?n=)만큼 다시 불러온다
  const [restoreTo, setRestoreTo] = useState(restored.shown);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const barVisible = useBarVisible();
  const sentinel = useRef<HTMLDivElement>(null);

  const goal = useDeviceGoal() ?? serverGoal;
  const searchable = isSearchable(query);
  const search = useInfiniteQuery({
    // 빈 검색어는 부르지 않는다(skipToken)
    ...searchQueries.result(searchable ? query : "", goal, API_SORT[sort]),
    // 정렬 · 목표를 바꾸면 새 결과가 올 때까지 앞 결과를 둔다(머리 · 정렬 버튼이 사라지지 않게)
    placeholderData: keepPreviousData,
  });
  const result = search.data;
  const loaded = result?.items.length ?? 0;
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isPlaceholderData,
    fetchNextPage,
  } = search;
  // 실패한 다음 페이지는 「다시 시도」로만 다시 부른다. 그러지 않으면 실패할 때마다 바로 다시 불러 끝없이 반복된다
  const canFetchMore =
    hasNextPage && !isFetchingNextPage && !isFetchNextPageError;

  // 끝 표시가 보이면 더 불러온다
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !canFetchMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void fetchNextPage();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [canFetchMore, fetchNextPage]);

  useEffect(() => {
    if (result && !isPlaceholderData && loaded < restoreTo && canFetchMore)
      void fetchNextPage();
  }, [
    result,
    isPlaceholderData,
    loaded,
    restoreTo,
    canFetchMore,
    fetchNextPage,
  ]);

  // 붙을 때 한 번 정한다(이 부품은 검색어마다 새로 붙는다). 정렬을 바꿔도 다시 보내지 않는다
  const [logWanted] = useState(() => searchable && shouldLogSearch(query));
  useEffect(() => settleSearchLog(query), [query]);
  const logged = useRef(false);
  const total = isPlaceholderData ? undefined : result?.total;
  useEffect(() => {
    if (!logWanted || total === undefined || logged.current) return;
    logged.current = true;
    logSearch({ keyword: query, resultCount: total });
  }, [logWanted, query, total]);

  // 정렬 · 불러온 개수를 주소에 남긴다. 기록은 쌓지 않고 서버도 다시 부르지 않는다
  useEffect(() => {
    const params = new URLSearchParams({ q: query });
    if (sort !== "score") params.set("sort", sort);
    if (loaded > PAGE_SIZE) params.set("n", String(loaded));
    window.history.replaceState(null, "", `/search?${params}`);
  }, [query, sort, loaded]);

  // 검색하면 검색칸이 새로 붙어 포커스가 사라진다. 결과 개수 제목으로 옮겨 읽게 한다
  useEffect(() => {
    if (active && !failed) headingRef.current?.focus();
  }, [active, failed]);

  if (!searchable) {
    return (
      <NoResults
        query={query}
        goal={goal}
        didYouMean={null}
        similar={[]}
        canRequest={false}
        headingRef={headingRef}
        onSearch={onSearch}
      />
    );
  }

  // 다음 페이지만 실패했으면 불러 둔 목록을 두고 끝 줄에서 다시 시도한다
  if (failed || (search.isError && !result)) {
    return (
      <ErrorState
        title="검색 결과를 불러오지 못했어요"
        onRetry={() => (failed ? router.refresh() : void search.refetch())}
        className="flex-1"
      />
    );
  }

  if (!result) {
    // 그린 화면이 없어 「더 불러오는 중」과 같은 모양의 한 줄로 둔다
    return (
      <div className="flex h-12 items-center justify-center pt-5">
        <p role="status" className="text-body2 text-text-sub">
          불러오는 중
        </p>
      </div>
    );
  }

  if (result.total === 0) {
    return (
      <NoResults
        query={query}
        goal={goal}
        didYouMean={result.didYouMean}
        similar={result.sameCategoryTop}
        canRequest={result.canRequestAnalysis}
        headingRef={headingRef}
        onSearch={onSearch}
      />
    );
  }

  const sortLabel = SEARCH_SORTS.find((s) => s.value === sort)!.label;

  return (
    <>
      <div className="flex items-center gap-2 px-5 pt-5 pb-1">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="min-w-0 flex-1 text-body1-bold text-text-strong outline-none"
        >
          검색 결과 {result.total}개
        </h2>
        {result.category && (
          // 2-2 점수 순위(그 중분류)
          <Link
            href={`/ranking/${encodeURIComponent(result.category.code)}`}
            className="shrink-0 text-[12px] font-medium text-brand-link"
          >
            {result.category.name} 순위 보기 <span aria-hidden>›</span>
          </Link>
        )}
      </div>
      <div className="flex h-11 items-center justify-between px-5">
        <GoalLink
          fallback={SCREEN_GOAL[serverGoal]}
          className="text-[12px] leading-5 font-medium text-brand-link"
        />
        {/* v3/SortButton: 글자 14 · 꺾쇠 16 · 누르는 높이 44, 테두리 · 바탕 없음 */}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setSortOpen(true)}
          className="flex h-11 items-center gap-0.5 pl-2 text-body2-medium text-text-strong"
        >
          <span className="sr-only">정렬: </span>
          {sortLabel}
          <IconChevronDown className="size-4 text-icon-default" />
        </button>
      </div>

      {result.pinned && (
        <ResultGrid items={[result.pinned]} goal={goal} className="pb-2" />
      )}
      <ResultGrid items={result.items} goal={goal} />

      {hasNextPage && (
        <div
          ref={sentinel}
          className="flex h-12 items-center justify-center gap-1"
        >
          {/* 영역이 먼저 있어야 읽으므로 늘 두고 글자만 바꾼다 */}
          <p role="status" className="text-body2 text-text-sub">
            {isFetchingNextPage
              ? "더 불러오는 중"
              : isFetchNextPageError
                ? "더 불러오지 못했어요"
                : ""}
          </p>
          {isFetchNextPageError && !isFetchingNextPage && (
            <Button kind="text" size="S" onClick={() => void fetchNextPage()}>
              다시 시도
            </Button>
          )}
        </div>
      )}
      {/* 아래 「찾는 제품이 없나요?」 바에 마지막 줄이 가리지 않게 */}
      <div aria-hidden className="h-[calc(52px+var(--safe-bottom))]" />

      <div
        className={cn(
          "fixed-app bottom-0 z-30 flex items-center justify-between border-t border-line-default bg-[#f3fcfb] pt-1 pr-3 pb-[max(var(--safe-bottom),4px)] pl-5 transition-transform duration-200",
          !barVisible && "translate-y-full",
        )}
        // 숨었을 때는 누를 수 없고 화면 읽기에서도 빠진다
        inert={!barVisible}
      >
        <p className="text-body2-medium text-text-strong">
          찾는 제품이 없나요?
        </p>
        <Button kind="text" size="M" asChild>
          <Link href={requestHref(query)}>제품 요청하기</Link>
        </Button>
      </div>

      <SortSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        options={SEARCH_SORTS}
        value={sort}
        onSelect={(next) => {
          setSort(next);
          setRestoreTo(PAGE_SIZE);
        }}
      />
    </>
  );
}

function ResultGrid({
  items,
  goal,
  className,
}: {
  items: ProductCardData[];
  /** 카드 점수는 내 목표 기준 */
  goal: Goal;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-3 gap-x-2.5 gap-y-5 px-5 pt-1 pb-5",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <ProductCard product={toCardInput(item, goal)} fluid />
        </li>
      ))}
    </ul>
  );
}

// 아래로 내리면 보이고 위로 올리면 숨는다. 맨 위에서는 보인다(【최종】 2-4 그림)
function useBarVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 4) return;
      setVisible(y <= 0 || y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return visible;
}

/** 3-6 제품 요청하기. 검색어를 제품 이름 칸에 채워 넘긴다 */
function requestHref(query: string) {
  return `/contribute/request?${new URLSearchParams({ name: query })}`;
}

/*
 * 2-4b 검색 0건(【최종】 ⑥ 9306:17509). 「○○와 일치하는 제품이 없어요」, 「이렇게 찾아볼까요?」 칩(→ 2-4),
 * 「가지고 있는 제품이라면」 바코드 찍기(→ 3-1) · 영양성분표 찍고 점수 보기(→ 3-7),
 * 「점수가 높은 비슷한 제품」 카드 3개(2-4 카드와 같음) + 「목표: 다이어트 ›」, 아래 「제품 이름만 알려 줘도 돼요」.
 */
function NoResults({
  query,
  goal,
  didYouMean,
  similar,
  canRequest,
  headingRef,
  onSearch,
}: {
  query: string;
  goal: Goal;
  /** 서버가 추정한 검색어. 없으면 「이렇게 찾아볼까요?」를 숨긴다 */
  didYouMean: string | null;
  /** 추정한 종류의 점수 상위(`sameCategoryTop`) */
  similar: ProductCardData[];
  /**
   * 「제품 이름만 알려 줘도 돼요」를 보일지(서버 `analysisRequestAvailable`). 지금 서버는 0건이면 늘 true다.
   * 서버를 부르지 않은 검색어(글자 · 숫자 없음)는 이름으로 요청할 말이 아니라 false
   */
  canRequest: boolean;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onSearch: (word: string) => void;
}) {
  const alternatives = didYouMean && didYouMean !== query ? [didYouMean] : [];
  return (
    <>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="px-5 pt-5 pb-2 text-center text-body2-medium break-keep text-text-sub outline-none"
      >
        {query}
        {particleWa(query)} 일치하는 제품이 없어요
      </h2>
      {alternatives.length > 0 && (
        <section
          aria-labelledby="alternatives-title"
          className="flex flex-col gap-2.5 px-5 pt-3 pb-2"
        >
          <h3
            id="alternatives-title"
            className="text-body1-medium text-text-strong"
          >
            이렇게 찾아볼까요?
          </h3>
          <ul className="flex flex-wrap gap-2">
            {alternatives.map((word) => (
              <li key={word}>
                <button
                  type="button"
                  onClick={() => onSearch(word)}
                  className="flex h-9 items-center rounded-full border border-line-strong bg-bg-page px-3.5 text-body2-medium text-text-strong"
                >
                  {word}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section
        aria-labelledby="own-title"
        className="flex flex-col gap-2.5 px-5 pt-4 pb-3.5"
      >
        <h3 id="own-title" className="text-body1-medium text-text-strong">
          가지고 있는 제품이라면
        </h3>
        <Button kind="secondary" asChild>
          <Link href="/scan">바코드 찍기</Link>
        </Button>
        {/* 3-7 영양성분표 찍기(08단계). 경로는 UI 플랜 라우트 표의 /contribute/* */}
        <Button kind="secondary" asChild>
          <Link href="/contribute/label">영양성분표 찍고 점수 보기</Link>
        </Button>
      </section>
      {/* 추정한 종류가 없으면(빈 목록) 이 구역째 없다 */}
      {similar.length > 0 && (
        <>
          <div aria-hidden className="h-2 bg-bg-band" />
          <section aria-labelledby="similar-title">
            <div className="flex flex-col gap-0.5 px-5 pt-4 pb-2">
              <h3 id="similar-title" className="text-section text-text-strong">
                점수가 높은 비슷한 제품
              </h3>
              <GoalLink
                fallback={SCREEN_GOAL[goal]}
                className="self-start text-[12px] leading-5 font-medium text-brand-link"
              />
            </div>
            <ResultGrid items={similar} goal={goal} className="pb-3" />
          </section>
        </>
      )}
      {canRequest && (
        <>
          <div aria-hidden className="h-2 bg-bg-band" />
          {/* 홈 「찾는 제품이 없나요?」와 같은 연한 민트 바탕(디자인 변수 없이 직접 넣은 색) */}
          <section className="flex items-center gap-2 bg-[#f3fcfb] py-4 pr-3 pl-5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h3 className="text-body1-bold text-text-strong">
                제품 이름만 알려 줘도 돼요
              </h3>
              <p className="text-body2 text-text-sub">
                이름을 알려 주면 점수를 매길 순서에 넣어요.
              </p>
            </div>
            <Button kind="text" size="M" asChild>
              <Link href={requestHref(query)}>제품 요청하기</Link>
            </Button>
          </section>
        </>
      )}
    </>
  );
}
