"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { BottomSheet } from "@/components/common/sheet";
import { IconChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

import { FIXTURE_MAJORS } from "./_fixtures";
import { MAJOR_ICON } from "./format";

/*
 * 2-5f 식품 분류(【최종】 ⑥ 지금 종류 9306:17998 · 다른 종류를 펼쳤을 때 18181) — 「종류 고르기」 바닥 시트.
 * 대분류 15줄(그림 · 이름 · 펼침 꺾쇠). 한 번에 대분류 하나만 펼치고, 펼치면 「전체」 + 순위가 열린 중분류 칩.
 * 지금 보는 대분류는 펼친 채 열리고 지금 칩(또는 「전체」)이 검은 칩이다. 칩을 누르면 시트를 닫고 바로 그 순위로 간다
 * (적용 버튼 없음). ✕ · 바깥은 아무것도 바꾸지 않고 닫는다. 걸린 정렬 · 필터는 종류를 바꿔도 잇는다(메모).
 */
export function RankingCategorySheet({
  open,
  onOpenChange,
  activeCode,
  hrefFor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 지금 보는 칩이나 대분류 코드. 종류를 고르지 않았으면 null(모두 접힌 채) */
  activeCode: string | null;
  /** 칩 · 대분류 코드로 갈 주소(걸린 정렬 · 필터를 잇는다) */
  hrefFor: (code: string) => string;
}) {
  const activeMajor =
    FIXTURE_MAJORS.find(
      (m) =>
        m.code === activeCode || m.chips.some((c) => c.code === activeCode),
    )?.code ?? null;
  const [expanded, setExpanded] = useState<string | null>(activeMajor);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="종류 고르기">
      {/* 공통 시트의 내용 칸 여백(좌우 20 · 위 8 · 아래 16)을 그림(줄이 시트 폭 가득 · 목록 끝 24)에 맞춘다 */}
      <ul className="-mx-5 -mt-2 pb-2">
        {FIXTURE_MAJORS.map((major) => {
          const isOpen = expanded === major.code;
          const panelId = `category-${major.code}`;
          return (
            <li key={major.code}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                onClick={() => setExpanded(isOpen ? null : major.code)}
                className="flex w-full items-center gap-3 px-5 py-[7px] text-left"
              >
                <Image
                  src={`/home/category/${MAJOR_ICON[major.code]}.png`}
                  width={168}
                  height={168}
                  sizes="38px"
                  alt=""
                  className="size-[38px] shrink-0 rounded-full"
                />
                <span className="min-w-0 flex-1 text-body1-medium text-text-strong">
                  {major.name}
                </span>
                <IconChevronDown
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0 text-icon-default transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && major.chips.length === 0 && (
                // 순위가 열린 중분류가 없는 대분류(API는 대분류 15개를 늘 주고 칩은 열린 것만 준다). 그림이 없어
                // 「전체」로 막다른 화면에 보내지 않고 글만 보인다(남은 질문 39)
                <p
                  id={panelId}
                  className="px-5 pt-1 pb-3 text-body2 text-text-sub"
                >
                  아직 순위가 열리지 않았어요
                </p>
              )}
              {isOpen && major.chips.length > 0 && (
                <ul
                  id={panelId}
                  aria-label={`${major.name} 종류`}
                  className="flex flex-wrap gap-2 px-5 pt-1 pb-3"
                >
                  {[{ code: major.code, name: "전체" }, ...major.chips].map(
                    (chip) => {
                      const selected = chip.code === activeCode;
                      return (
                        <li key={chip.code}>
                          <Link
                            href={hrefFor(chip.code)}
                            aria-current={selected ? "page" : undefined}
                            onClick={(event) => {
                              // 지금 보는 곳이면 옮기지 않고 닫기만 한다(불러온 개수 · 스크롤을 지킨다)
                              if (selected) event.preventDefault();
                              onOpenChange(false);
                            }}
                            className={cn(
                              "inline-flex h-9 items-center rounded-full border px-3.5 whitespace-nowrap",
                              // 2-5f의 고른 칩은 공통 Chip의 고른 모양(옅은 연두)과 달리 검은 면 + 흰 굵은 글자
                              selected
                                ? "border-transparent bg-bg-dark text-body2-bold text-white"
                                : "border-line-strong bg-bg-page text-body2-medium text-text-strong",
                            )}
                          >
                            {chip.code === major.code && (
                              <span className="sr-only">{major.name} </span>
                            )}
                            {chip.name}
                          </Link>
                        </li>
                      );
                    },
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
