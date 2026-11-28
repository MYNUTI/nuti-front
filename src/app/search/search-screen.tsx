"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BackButton } from "@/components/common/back-button";
import { SearchField } from "@/components/common/search-field";
import { TopBar } from "@/components/common/top-bar";
import { IconChevronRight, IconClose } from "@/components/icons";
import type { Goal } from "@/lib/goal/types";
import { searchQueries, usePopularKeywords } from "@/lib/search/queries";
import type { SearchSuggestion } from "@/lib/search/types";
import { cn } from "@/lib/utils";

import type { SearchSort } from "./sorts";
import { particleRo } from "./hangul";
import { popularUpdatedLabel } from "./popular";
import { MAX_QUERY_LENGTH, PAGE_SIZE } from "./result-params";
import { markSearchLog } from "./search-log";
import { SearchResults } from "./search-results";
import {
  addRecent,
  clearRecent,
  removeRecent,
  useRecentSearches,
} from "./recent-store";

/*
 * 2-3 검색(【최종】 ⑥ 9306:17337 · 처음 19033 · 입력 중 17389).
 * 검색칸에 커서가 들어간 채로 열린다. 비어 있으면 최근 검색어(있을 때) + 인기 검색어, 글자를 넣으면 자동완성.
 * 찾은 말은 최근 검색어에 남기고 2-4 검색 결과(`/search?q=`)로 간다. ‹ → 이전 화면.
 * 같은 주소에서 검색어가 있으면 2-4 검색 결과를 보이고, 검색칸을 누르면 2-3(입력 중)으로 바뀐다.
 * 【최종】 메모: 0-3에서 왔어도 검색칸 아래에 안내 문장은 띄우지 않는다.
 * 인기 검색어는 `GET /search/keywords/popular`, 자동완성은 `GET /search/suggestions`(입력이 멈추면 부르고 새 결과가 올
 * 때까지 앞 결과를 둔다). 서버가 30자를 넘는 검색어를 거절해 입력 칸에서 30자로 막는다.
 */
const SUGGEST_DELAY_MS = 250;

export function SearchScreen({
  initialQuery,
  initialSort = "score",
  initialShown = PAGE_SIZE,
  failed = false,
  goal,
}: {
  initialQuery: string;
  initialSort?: SearchSort;
  initialShown?: number;
  /** 2-4 미리 보기 `?state=error` */
  failed?: boolean;
  /** 서버가 기기 쿠키로 읽은 내 목표 */
  goal: Goal;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  // 검색어 없이 열면(2-3) 바로 입력, 검색어로 열면(2-4) 결과를 보이다가 검색칸을 누르면 입력으로
  const [editing, setEditing] = useState(initialQuery === "");
  const trimmed = query.trim();
  const typing = trimmed.length > 0;
  // 2-4 결과를 보는 동안(편집 중이 아님)에는 보이지 않는 자동완성을 부르지 않는다
  const suggestQuery = useDebounced(editing ? trimmed : "", SUGGEST_DELAY_MS);
  const suggestions =
    useQuery({
      ...searchQueries.suggestions(suggestQuery),
      // 앞 말에 이어 칠 때만 새 결과가 올 때까지 앞 결과를 둔다. 지우고 다른 말을 치면 관계없는 앞 결과를 보이지 않는다
      placeholderData: (previous, previousQuery) => {
        const previousWord = previousQuery?.queryKey[2];
        return previousWord && suggestQuery.startsWith(previousWord)
          ? previous
          : undefined;
      },
    }).data ?? [];
  // 지우기 · ✕ · 모두 지우기는 누른 버튼이 사라진다. 포커스(모바일은 키보드)를 검색칸에 남긴다
  const inputRef = useRef<HTMLInputElement>(null);
  const focusInput = () => inputRef.current?.focus();

  const search = (word: string) => {
    const w = word.trim();
    if (!w) return;
    addRecent(w);
    // 지금 결과와 같은 말이면 주소를 다시 쌓지 않고 결과로 돌아간다
    if (w === initialQuery) {
      setQuery(w);
      setEditing(false);
      inputRef.current?.blur();
      return;
    }
    markSearchLog(w);
    router.push(`/search?q=${encodeURIComponent(w)}`);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-safe">
      <TopBar left={<BackButton fallbackHref="/home" />}>
        <form
          role="search"
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            search(query);
          }}
        >
          <SearchField
            ref={inputRef}
            aria-label="검색어"
            placeholder="제품, 브랜드, 종류로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setEditing(true)}
            onClear={() => {
              setQuery("");
              setEditing(true);
              focusInput();
            }}
            // 【최종】 메모: 2-3은 검색창에 커서가 들어간 채로 열린다(2-4 결과는 아님)
            autoFocus={editing}
            maxLength={MAX_QUERY_LENGTH}
            className="h-11"
          />
        </form>
      </TopBar>
      <main className="flex flex-1 flex-col">
        <h1 className="sr-only">검색</h1>
        {/* 자동완성이 바뀌면 화면 읽기 프로그램에 알린다. 영역이 먼저 있어야 읽으므로 늘 둔다 */}
        <p role="status" className="sr-only">
          {editing && trimmed.length > 1
            ? suggestions.length > 0
              ? `자동완성 ${suggestions.length}개`
              : "자동완성 없음"
            : ""}
        </p>
        {initialQuery && (
          // 검색칸을 눌러도 결과를 지우지 않고 숨겨 두어 같은 말로 돌아오면 정렬 · 불러온 개수가 남는다
          <div hidden={editing} className="flex flex-1 flex-col">
            <SearchResults
              query={initialQuery}
              initialSort={initialSort}
              initialShown={initialShown}
              active={!editing}
              failed={failed}
              goal={goal}
              onSearch={search}
            />
          </div>
        )}
        {editing &&
          (typing ? (
            <Suggestions
              query={trimmed}
              items={suggestions}
              onSearch={search}
            />
          ) : (
            <>
              <RecentSection onSearch={search} onRemoved={focusInput} />
              <PopularSection onSearch={search} />
            </>
          ))}
      </main>
    </div>
  );
}

function RecentSection({
  onSearch,
  onRemoved,
}: {
  onSearch: (word: string) => void;
  /** ✕ · 모두 지우기 뒤 포커스를 옮길 곳 */
  onRemoved: () => void;
}) {
  const recent = useRecentSearches();
  // 【최종】 2-3 검색(처음): 최근 검색어가 없으면 이 구역째 없다
  if (recent.length === 0) return null;
  return (
    <>
      <section aria-labelledby="recent-title" className="pt-10">
        <div className="flex items-center gap-2 px-5 pb-2">
          <h2
            id="recent-title"
            className="min-w-0 flex-1 text-section text-text-strong"
          >
            최근 검색어
          </h2>
          <button
            type="button"
            onClick={() => {
              clearRecent();
              onRemoved();
            }}
            className="shrink-0 text-body2-medium text-text-sub"
          >
            모두 지우기
          </button>
        </div>
        <ul className="flex gap-2 overflow-x-auto px-5 pt-2 pb-6">
          {recent.map((word) => (
            // v2/Chip removable 모양. 글자는 그 말로 검색, ✕는 그 말만 지운다
            <li
              key={word}
              className="flex h-9 shrink-0 items-center rounded-full border border-line-strong bg-bg-page"
            >
              <button
                type="button"
                onClick={() => onSearch(word)}
                className="h-full pl-3.5 text-body2-medium whitespace-nowrap text-text-strong"
              >
                {word}
              </button>
              <button
                type="button"
                aria-label={`${word} 지우기`}
                onClick={() => {
                  removeRecent(word);
                  onRemoved();
                }}
                className="flex h-full items-center pr-2.5 pl-1 text-icon-default"
              >
                <IconClose className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <div aria-hidden className="h-2 bg-bg-band" />
    </>
  );
}

/** 입력이 멈춘 뒤의 값. 글자마다 자동완성을 부르지 않게 한다 */
function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function PopularSection({ onSearch }: { onSearch: (word: string) => void }) {
  const { data } = usePopularKeywords();
  // 서버가 아직 모으기 전이면(빈 목록) 이 구역째 없다. 불러오는 중 · 실패도 그린 화면이 없어 비워 둔다
  if (!data || data.keywords.length === 0) return null;
  const updatedLabel = popularUpdatedLabel(data.basedAt);
  const words = [...data.keywords]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10)
    .map((k) => k.keyword);
  // 【최종】: 2열 × 5줄. 왼쪽 열 1~5, 오른쪽 열 6~10
  const columns = [words.slice(0, 5), words.slice(5, 10)];
  return (
    <section
      aria-labelledby="popular-title"
      className="flex flex-col gap-3 px-5 pt-6 pb-4"
    >
      {/* 【최종】 메모: 「급상승 검색어」 탭은 출시 때 숨긴다. 인기 검색어를 보일 최소 검색 수는 안 정함(SRCH_009) */}
      <div className="flex items-center gap-4">
        <h2 id="popular-title" className="text-section text-text-strong">
          인기 검색어
        </h2>
        <p className="ml-auto text-caption font-normal text-text-hint">
          {updatedLabel}
        </p>
      </div>
      <div className="flex gap-4">
        {columns.map((column, c) => (
          <ol
            key={c}
            start={c * 5 + 1}
            className="flex min-w-0 flex-1 flex-col"
          >
            {column.map((word, i) => {
              const rank = c * 5 + i + 1;
              return (
                <li key={word}>
                  <button
                    type="button"
                    onClick={() => onSearch(word)}
                    className="flex w-full items-center gap-2.5 py-2.5 text-left text-[15px]"
                  >
                    {/* 【최종】 메모: 1~3위 숫자는 파랑 */}
                    <span
                      aria-hidden
                      className={cn(
                        "w-[18px] shrink-0 font-bold",
                        rank <= 3
                          ? "text-accent-blue-text"
                          : "text-text-strong",
                      )}
                    >
                      {rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-text-body">
                      <span className="sr-only">{rank}위 </span>
                      {word}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ))}
      </div>
    </section>
  );
}

function Suggestions({
  query,
  items,
  onSearch,
}: {
  query: string;
  items: SearchSuggestion[];
  onSearch: (word: string) => void;
}) {
  // v2/ListRow 모양(오른쪽 ›). 찾은 말을 최근 검색어에 남기려고 링크 대신 버튼으로 둔다
  const searchAll = (label: React.ReactNode) => (
    <button
      type="button"
      onClick={() => onSearch(query)}
      className="flex w-full items-center gap-3 px-5 py-4 text-left"
    >
      <span className="min-w-0 flex-1 truncate text-body1 text-text-strong">
        {label}
      </span>
      <IconChevronRight className="size-5 shrink-0 text-icon-sub" />
    </button>
  );

  // API처럼 1자는 자동완성이 없다. 이때는 전체 검색 줄만 둔다(정한 것)
  if (query.length <= 1) return searchAll(`${query} 검색 결과 전체 보기`);

  if (items.length === 0) {
    return (
      <>
        {/* 【최종】 메모: 자동완성이 0개면 안내와 「검색해서 비슷한 제품 보기」 줄 */}
        <p className="px-5 pt-6 pb-2 text-body1 text-text-sub">
          ‘{query}’{particleRo(query)} 시작하는 이름이 없어요
        </p>
        {searchAll("검색해서 비슷한 제품 보기")}
      </>
    );
  }

  return (
    <>
      <ul className="pt-2">
        {items.map((item, i) => (
          <li key={item.type === "PRODUCT" ? item.productId : `k:${item.name}`}>
            {/* 줄 사이 선은 양옆 20 안쪽, 마지막 선(전체 보기 위)은 끝까지(【최종】) */}
            {i > 0 && <div aria-hidden className="mx-5 h-px bg-line-default" />}
            {item.type === "PRODUCT" ? (
              <SuggestionRow item={item} />
            ) : (
              <KeywordRow item={item} onSearch={onSearch} />
            )}
          </li>
        ))}
      </ul>
      <div aria-hidden className="h-px bg-line-default" />
      {searchAll(`${query} 검색 결과 전체 보기`)}
    </>
  );
}

/** 서버가 준 일치 구간 [시작, 끝)을 칠한다. 구간이 여럿이어도 디자인처럼 첫 구간만 칠한다 */
function Highlighted({ item }: { item: SearchSuggestion }) {
  const range = item.matchedRanges[0];
  if (!range) return item.name;
  return (
    <>
      {item.name.slice(0, range[0])}
      <span className="text-brand-link">
        {item.name.slice(range[0], range[1])}
      </span>
      {item.name.slice(range[1])}
    </>
  );
}

function SuggestionRow({
  item,
}: {
  item: Extract<SearchSuggestion, { type: "PRODUCT" }>;
}) {
  return (
    <Link
      href={`/product/${encodeURIComponent(item.productId)}`}
      className="flex items-center gap-3 px-5 py-2.5"
    >
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-bg-tint">
        <SuggestionThumb />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body1 text-text-strong">
          <Highlighted item={item} />
        </span>
        {/* 【최종】 메모: 제품 이름 아래 줄에 브랜드 */}
        {item.brandName && (
          <span className="truncate text-body2 text-text-sub">
            {item.brandName}
          </span>
        )}
      </span>
    </Link>
  );
}

/**
 * 사전 대표어 제안(오타 보정 등). 그린 줄이 없어 사진 · 브랜드 없이 글자만 두고, 누르면 그 말로 검색한다
 * (최근 검색어에도 남긴다)
 */
function KeywordRow({
  item,
  onSearch,
}: {
  item: SearchSuggestion;
  onSearch: (word: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSearch(item.name)}
      className="flex w-full items-center px-5 py-2.5 text-left"
    >
      <span className="min-w-0 flex-1 truncate text-body1 text-text-strong">
        <Highlighted item={item} />
      </span>
    </button>
  );
}

/** 자동완성 줄의 작은 사진. API 자동완성 응답에 사진이 없어(UI 플랜 「남은 질문」 25) 3-2 「사진이 없을 때」 그림(작은 칸이라 글 없이)을 쓴다 */
function SuggestionThumb() {
  return (
    <Image
      src="/common/no-photo.png"
      width={32}
      height={32}
      alt=""
      className="size-full"
    />
  );
}
