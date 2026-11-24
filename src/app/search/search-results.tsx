"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/common/empty-state";
import { ProductCard } from "@/components/common/product-card";
import { SortSheet } from "@/components/common/sort-sheet";
import { IconChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

import { particleWa } from "./hangul";
import { PAGE_SIZE, readResultParams } from "./result-params";
import {
  FIXTURE_SEARCH_GOAL_LABEL,
  fixtureAlternatives,
  fixtureSearch,
  fixtureSimilarTop,
  SEARCH_SORTS,
  type SearchResultItem,
  type SearchSort,
} from "./_fixtures";

/*
 * 2-4 검색 결과(【최종】 ⑥ 9306:17425 · 사진이 없는 제품이 섞일 때 17730 · 내려 볼 때 19410).
 * 세로로 내리며 12개씩 더 불러오는 3열 카드 격자 한 목록(묶음 없음). 맨 위 「검색 결과 n개」 · 「○○ 순위 보기 ›」,
 * 그 아래 「목표: 다이어트 ›」(→ 5-2) · 정렬 버튼(→ 정렬 시트). 점수 없는 제품은 맨 뒤, 회색 「점수 없음」(→ 3-6).
 * 검색어가 제품 이름 전체와 같으면 그 제품을 맨 위 한 칸에 따로 둔다.
 * 「찾는 제품이 없나요?」 바는 아래로 내리면 올라오고 위로 올리면 숨는다.
 * 오른쪽 세로 스크롤 표시는 브라우저 기본(내리는 동안 보임)을 쓴다(【최종】 메모: 늘 보이게 할지는 개발에서 정함).
 */
// fixture는 바로 오지만 「더 불러오는 중」 상태를 보이려고 잠깐 기다린다(API 연결 때 지운다)
const FIXTURE_LOAD_MS = 400;

export function SearchResults({
  query,
  initialSort,
  initialShown,
  active,
  failed,
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
  const [shown, setShown] = useState(restored.shown);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const barVisible = useBarVisible();
  const sentinel = useRef<HTMLDivElement>(null);

  const result = fixtureSearch(query, sort);
  const hasMore = shown < result.items.length;

  // 끝 표시가 보이면 더 불러온다
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setLoadingMore(true);
    });
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

  // 정렬 · 불러온 개수를 주소에 남긴다. 기록은 쌓지 않고 서버도 다시 부르지 않는다
  useEffect(() => {
    const params = new URLSearchParams({ q: query });
    if (sort !== "score") params.set("sort", sort);
    if (shown > PAGE_SIZE) params.set("n", String(shown));
    window.history.replaceState(null, "", `/search?${params}`);
  }, [query, sort, shown]);

  // 검색하면 검색칸이 새로 붙어 포커스가 사라진다. 결과 개수 제목으로 옮겨 읽게 한다
  useEffect(() => {
    if (active && !failed) headingRef.current?.focus();
  }, [active, failed]);

  if (failed) {
    return (
      <ErrorState
        title="검색 결과를 불러오지 못했어요"
        onRetry={() => router.refresh()}
        className="flex-1"
      />
    );
  }

  if (result.total === 0) {
    return (
      <NoResults query={query} headingRef={headingRef} onSearch={onSearch} />
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
          // 2-2 점수 순위. 종류를 고른 채로 여는 주소는 07단계에서 정한다
          <Link
            href={`/ranking?category=${encodeURIComponent(result.category)}`}
            className="shrink-0 text-[12px] font-medium text-brand-link"
          >
            {result.category} 순위 보기 <span aria-hidden>›</span>
          </Link>
        )}
      </div>
      <div className="flex h-11 items-center justify-between px-5">
        <Link
          href="/my/goal"
          className="text-[12px] leading-5 font-medium text-brand-link"
        >
          목표: {FIXTURE_SEARCH_GOAL_LABEL} <span aria-hidden>›</span>
        </Link>
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

      {result.exact && <ResultGrid items={[result.exact]} className="pb-2" />}
      <ResultGrid items={result.items.slice(0, shown)} />

      {hasMore && (
        <div ref={sentinel} className="flex h-12 items-center justify-center">
          {/* 영역이 먼저 있어야 읽으므로 늘 두고 글자만 바꾼다 */}
          <p role="status" className="text-body2 text-text-sub">
            {loadingMore ? "더 불러오는 중" : ""}
          </p>
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
          <Link href="/contribute/name">제품 요청하기</Link>
        </Button>
      </div>

      <SortSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        options={SEARCH_SORTS}
        value={sort}
        onSelect={(next) => {
          setSort(next);
          setShown(PAGE_SIZE);
        }}
      />
    </>
  );
}

function ResultGrid({
  items,
  className,
}: {
  items: SearchResultItem[];
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
          <ProductCard product={item} href={item.href} fluid />
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

/*
 * 2-4b 검색 0건(【최종】 ⑥ 9306:17509). 「○○와 일치하는 제품이 없어요」, 「이렇게 찾아볼까요?」 칩(→ 2-4),
 * 「가지고 있는 제품이라면」 바코드 찍기(→ 3-1) · 영양성분표 찍고 점수 보기(→ 3-7),
 * 「점수가 높은 비슷한 제품」 카드 3개(2-4 카드와 같음) + 「목표: 다이어트 ›」, 아래 「제품 이름만 알려 줘도 돼요」.
 */
function NoResults({
  query,
  headingRef,
  onSearch,
}: {
  query: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onSearch: (word: string) => void;
}) {
  const alternatives = fixtureAlternatives(query);
  const similar = fixtureSimilarTop();
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
      <div aria-hidden className="h-2 bg-bg-band" />
      <section aria-labelledby="similar-title">
        <div className="flex flex-col gap-0.5 px-5 pt-4 pb-2">
          <h3 id="similar-title" className="text-section text-text-strong">
            점수가 높은 비슷한 제품
          </h3>
          <Link
            href="/my/goal"
            className="self-start text-[12px] leading-5 font-medium text-brand-link"
          >
            목표: {FIXTURE_SEARCH_GOAL_LABEL} <span aria-hidden>›</span>
          </Link>
        </div>
        <ResultGrid items={similar} className="pb-3" />
      </section>
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
          <Link href="/contribute/name">제품 요청하기</Link>
        </Button>
      </section>
    </>
  );
}
