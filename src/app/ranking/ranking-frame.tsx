"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Chip } from "@/components/common/chip";
import { Toast } from "@/components/common/toast";
import { TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";
import { cn } from "@/lib/utils";

import { NO_FILTERS, type RankingChip, type RankingFilters } from "./_fixtures";
import {
  brandChipLabel,
  FILTER_TAB_LABEL,
  type FilterTab,
  sellerChipLabel,
  sellerLabel,
} from "./format";

/*
 * 2-2 점수 순위의 틀 부품. `review/v3-rankings`의 `ranking-frame.tsx`를 옮겼다
 * (그 브랜치의 탭 바 사본은 공통 TabBar가 이미 같은 모양이라 옮기지 않았다).
 */

/*
 * 위 한 줄: 제목 「랭킹」 + 대분류 버튼 + 검색(11-16 — 대분류 버튼을 제목 줄로 올림).
 * 공통 TopBar(root)는 오른쪽 버튼을 4px에 두는데 이 화면 그림은 8px이고, 제목 옆에 버튼이 붙어 따로 그렸다.
 */
export function RankingTitleBar({
  major,
  onMajorClick,
}: {
  /** 고른 대분류 이름. 없으면 고르지 않은 모양(「종류」) */
  major: string | null;
  /** 없으면 대분류 버튼을 숨긴다(순위가 열린 종류가 없을 때) */
  onMajorClick?: () => void;
}) {
  return (
    <div className="flex h-13 items-center bg-bg-page pr-2 pl-5">
      <h1 className="text-title1 text-text-strong">랭킹</h1>
      {onMajorClick && (
        <Chip
          kind="dropdown"
          aria-haspopup="dialog"
          onClick={onMajorClick}
          className={cn(
            "ml-3 min-w-0",
            // 고른 대분류: 테두리 없이 #2b3036 면 + 흰 굵은 글자. 공통 Chip의 고른 모양(옅은 연두)과 달라 여기서 덮어 쓴다
            major &&
              "border-transparent bg-text-body text-body2-bold text-white [&_svg]:text-white",
          )}
        >
          <span className="truncate">{major ?? "종류"}</span>
        </Chip>
      )}
      <TopBarButton asChild className="ml-auto">
        <Link href="/search" aria-label="검색">
          <IconSearch />
        </Link>
      </TopBarButton>
    </div>
  );
}

/*
 * 중분류 글자 탭 줄(높이 44). 맨 앞 「전체」(대분류 전체), 그다음 순위가 열린 칩. 고른 탭은 굵게 + 밑줄이고,
 * 화면 밖이면 보이는 자리까지 민다.
 */
export function MidTabs({
  majorCode,
  chips,
  activeCode,
  hrefFor,
}: {
  majorCode: string;
  chips: RankingChip[];
  /** 대분류 코드면 「전체」, 칩 코드면 그 칩 */
  activeCode: string;
  hrefFor: (code: string) => string;
}) {
  const active = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    active.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [activeCode, chips.length]);

  const tabs = [{ code: majorCode, name: "전체" }, ...chips];

  return (
    <nav
      aria-label="중분류"
      className="flex h-11 [scrollbar-width:none] overflow-x-auto border-b border-[#eef0f3] bg-white [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const selected = tab.code === activeCode;
        return (
          <Link
            key={tab.code}
            ref={selected ? active : undefined}
            href={hrefFor(tab.code)}
            aria-current={selected ? "page" : undefined}
            // 탭을 옮겨도 위 고정 줄이 그대로라 화면 맨 위로 올리지 않는다
            scroll={false}
            className={cn(
              "flex h-11 shrink-0 items-center px-[11px] text-[15px] leading-[18px]",
              selected
                ? "border-b-2 border-text-strong font-bold text-text-strong"
                : "font-medium text-text-sub",
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}

/** 필터 칩 아래 기준 줄: 회색 두 줄(목표 · 개수나 날짜) + 「점수 기준 보기 ›」(→ 5-4) */
export function CriteriaRow({ lines }: { lines: [string, string | null] }) {
  const [first, second] = lines;
  return (
    <div className="flex items-center gap-2 px-4 pt-1.5 pb-2.5 text-[12px] leading-4">
      <p className="min-w-0 flex-1 text-text-sub">
        {first}
        {second && (
          <>
            <br />
            {second}
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
  );
}

/** 흰 묶음 카드: 머리(제목 + 「전체 보기 ›」) 아래 제품 줄 */
export function GroupCard({
  id,
  title,
  moreHref,
  children,
}: {
  id: string;
  title: string;
  moreHref: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-1.5 rounded-md bg-white px-3.5 pt-3 pb-2"
    >
      <div className="flex items-center">
        <h2
          id={id}
          className="min-w-0 flex-1 truncate text-[16px] leading-[19px] font-bold text-text-strong"
        >
          {title}
        </h2>
        <Link
          href={moreHref}
          className="shrink-0 text-[13px] leading-4 font-medium text-brand-link"
        >
          전체 보기
          <span className="sr-only">: {title}</span> <span aria-hidden>›</span>
        </Link>
      </div>
      {children}
    </section>
  );
}

/*
 * 【최종】 2-2 필터 칩 3개(판매처 · 브랜드 · 영양성분). 누르면 그 탭으로 필터 시트(2-5 · 2-5b)를 연다.
 * 고른 필터가 있으면 그 칩은 초록(글자는 고른 값)이고 줄 끝에 「초기화」(【최종】 「필터 적용, 판매처」).
 */
export function FilterChips({
  filters = NO_FILTERS,
  onFilterClick,
  onReset,
  sellerChipRef,
}: {
  filters?: RankingFilters;
  onFilterClick: (tab: FilterTab) => void;
  onReset?: () => void;
  /** 초기화하면 「초기화」가 사라지므로 포커스를 받을 첫 칩(판매처) */
  sellerChipRef?: React.Ref<HTMLButtonElement>;
}) {
  // 화면 읽기에는 줄이지 않은 값 전체를 읽힌다(「CU 외 1」 · 「브랜드 2」 · 말줄임 대신)
  const chips: {
    tab: FilterTab;
    label: string;
    values: string[];
  }[] = [
    {
      tab: "seller",
      label: sellerChipLabel(filters.sellers),
      values: filters.sellers.map(sellerLabel),
    },
    {
      tab: "brand",
      label: brandChipLabel(filters.brands),
      values: filters.brands,
    },
    { tab: "nutrient", label: "영양성분", values: [] },
  ];
  const any = chips.some((c) => c.values.length > 0);

  return (
    <div className="flex items-center gap-2 pt-2.5 pr-4 pb-0.5">
      {/* 고른 값 글자가 길면 칩만 가로로 밀고 「초기화」는 오른쪽에 둔다(넘칠 때 그림 없음, 남은 질문 32) */}
      <div className="flex min-w-0 [scrollbar-width:none] gap-2 overflow-x-auto pl-4 [&::-webkit-scrollbar]:hidden">
        {chips.map(({ tab, label, values }) => (
          <Chip
            key={tab}
            ref={tab === "seller" ? sellerChipRef : undefined}
            kind="dropdown"
            selected={values.length > 0}
            aria-haspopup="dialog"
            onClick={() => onFilterClick(tab)}
          >
            {values.length > 0 ? (
              <>
                <span aria-hidden>{label}</span>
                <span className="sr-only">
                  {FILTER_TAB_LABEL[tab]}: {values.join(", ")}
                </span>
              </>
            ) : (
              label
            )}
          </Chip>
        ))}
      </div>
      {any && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 text-body2-medium text-text-sub"
        >
          초기화
          <span className="sr-only"> (필터)</span>
        </button>
      )}
    </div>
  );
}

/*
 * 07단계에서 차례로 붙일 화면(브랜드 · 영양성분 필터 · 대분류 화면의 필터 · 2-5f 식품 분류)으로 가는 버튼을 눌렀을 때의 알림.
 * 버튼 모양은 그림 그대로 두고, 그 화면을 붙이면 이 알림 대신 연결한다(그 브랜치의 검토용 알림과 같은 쓰임).
 */
export function useNotBuiltNotice(
  /** 아래 고정 줄(비교함 바) 위에 띄울 때 Toast의 bottom을 덮어 쓴다 */
  className?: string,
) {
  const [notice, setNotice] = useState<{ id: number; screen: string } | null>(
    null,
  );

  return {
    show: (screen: string) =>
      setNotice((prev) => ({ id: (prev?.id ?? 0) + 1, screen })),
    element: notice && (
      <Toast
        // 같은 버튼을 다시 눌러도 알림이 다시 뜨게 한다
        key={notice.id}
        message={`아직 만들지 않은 화면이에요: ${notice.screen}`}
        className={className}
      />
    ),
  };
}
