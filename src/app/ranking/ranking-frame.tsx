"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Chip } from "@/components/common/chip";
import { Toast } from "@/components/common/toast";
import { TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";
import { cn } from "@/lib/utils";

import type { RankingChip } from "./_fixtures";

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
  onMajorClick: () => void;
}) {
  return (
    <div className="flex h-13 items-center bg-bg-page pr-2 pl-5">
      <h1 className="text-title1 text-text-strong">랭킹</h1>
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
      <TopBarButton asChild className="ml-auto">
        <Link href="/search" aria-label="검색">
          <IconSearch />
        </Link>
      </TopBarButton>
    </div>
  );
}

/*
 * 중분류 글자 탭 줄(높이 44). 맨 앞 「전체」, 그다음 순위가 열린 칩. 고른 탭은 굵게 + 밑줄이고,
 * 화면 밖이면 보이는 자리까지 민다.
 */
export function MidTabs({
  chips,
  activeCode,
  hrefFor,
  onAllClick,
}: {
  chips: RankingChip[];
  activeCode: string;
  hrefFor: (code: string) => string;
  /** 「전체」 탭(대분류 전체 화면) */
  onAllClick: () => void;
}) {
  const active = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    active.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [activeCode, chips.length]);

  const tab =
    "flex h-11 shrink-0 items-center px-[11px] text-[15px] leading-[18px]";
  const idle = "font-medium text-text-sub";

  return (
    <nav
      aria-label="중분류"
      className="flex h-11 [scrollbar-width:none] overflow-x-auto border-b border-[#eef0f3] bg-white [&::-webkit-scrollbar]:hidden"
    >
      <button type="button" className={cn(tab, idle)} onClick={onAllClick}>
        전체
      </button>
      {chips.map((chip) => {
        const selected = chip.code === activeCode;
        return (
          <Link
            key={chip.code}
            ref={selected ? active : undefined}
            href={hrefFor(chip.code)}
            aria-current={selected ? "page" : undefined}
            // 탭을 옮겨도 위 고정 줄이 그대로라 화면 맨 위로 올리지 않는다
            scroll={false}
            className={cn(
              tab,
              selected
                ? "border-b-2 border-text-strong font-bold text-text-strong"
                : idle,
            )}
          >
            {chip.name}
          </Link>
        );
      })}
    </nav>
  );
}

/** 【최종】 2-2 필터 칩 3개(판매처 · 브랜드 · 영양성분). 누르면 필터 시트(2-5 · 2-5b)를 연다 */
export const RANKING_FILTERS = [
  { name: "판매처", screen: "2-5b 필터(판매처)" },
  { name: "브랜드", screen: "2-5 필터(브랜드)" },
  { name: "영양성분", screen: "2-5 필터(영양성분)" },
];

export function FilterChips({
  onFilterClick,
}: {
  onFilterClick: (screen: string) => void;
}) {
  return (
    <div className="flex gap-2 px-4 pt-2.5 pb-0.5">
      {RANKING_FILTERS.map(({ name, screen }) => (
        <Chip
          key={name}
          kind="dropdown"
          aria-haspopup="dialog"
          onClick={() => onFilterClick(screen)}
        >
          {name}
        </Chip>
      ))}
    </div>
  );
}

/*
 * 07단계에서 차례로 붙일 화면(필터 시트 · 2-5f 식품 분류 · 대분류 전체)으로 가는 버튼을 눌렀을 때의 알림.
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
