"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Chip } from "@/components/common/chip";
import { TopBarButton } from "@/components/common/top-bar";
import {
  IconBarcode,
  IconHome,
  IconMy,
  IconRanking,
  IconRecord,
  IconSearch,
} from "@/components/icons";
import type { RankingChip } from "@/lib/ranking/types";
import { cn } from "@/lib/utils";

/*
 * 2-2 점수 순위의 위 한 줄: 제목 「랭킹」 + 대분류 버튼 + 검색(11-16 — 대분류 버튼을 제목 줄로 올림).
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

/** 필터 칩 줄. 누르면 필터 시트(2-5·2-5b)를 연다 */
export function FilterChips({
  filters,
  onFilterClick,
}: {
  filters: string[];
  onFilterClick: (name: string) => void;
}) {
  return (
    <div className="flex gap-2 px-4 pt-2.5 pb-0.5">
      {filters.map((name) => (
        <Chip key={name} kind="dropdown" onClick={() => onFilterClick(name)}>
          {name}
        </Chip>
      ))}
    </div>
  );
}

const TABS = [
  { key: "home", href: "/home", label: "홈", Icon: IconHome },
  { key: "ranking", href: "/v3/rankings", label: "랭킹", Icon: IconRanking },
  { key: "scan", href: "/scan", label: "스캔", Icon: IconBarcode },
  { key: "history", href: "/history", label: "기록", Icon: IconRecord },
  { key: "my", href: "/my", label: "내 정보", Icon: IconMy },
] as const;

/*
 * v2/TabBar의 검토용 사본. 공통 TabBar와 다른 점 두 가지 때문에 따로 뒀다(공통 부품은 고치지 않는다).
 *   1. 랭킹 탭이 `/v3/rankings`를 가리키고, 그 아래 경로에서 고른 모양이 된다(공통은 `/ranking`)
 *   2. 스캔 버튼이 검정 면 + 흰 아이콘이다(피그마 【최종】 `brand/button` #141516. 공통은 라임)
 * 합칠 때는 공통 TabBar에 이 두 가지를 옮기고 이 사본을 지운다.
 */
export function RankingTabBar({ rankingHref }: { rankingHref: string }) {
  return (
    <nav className="fixed-app bottom-0 z-20 border-t border-line-default bg-bg-page pb-safe">
      <ul className="flex h-14">
        {TABS.map(({ key, href, label, Icon }) => {
          if (key === "scan") {
            return (
              <li key={key} className="relative flex-1">
                <Link
                  href={href}
                  className="flex h-full flex-col items-center justify-end pb-2 text-caption text-text-sub"
                >
                  <span className="absolute -top-6 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-bg-dark text-white shadow-[0_4px_12px_0_rgba(31,122,99,0.28)]">
                    <Icon className="size-7" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          }

          const active = key === "ranking";
          return (
            <li key={key} className="flex-1">
              <Link
                href={active ? rankingHref : href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5",
                  active
                    ? "text-caption-bold text-tab-active"
                    : "text-caption text-text-sub",
                )}
              >
                <Icon />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
