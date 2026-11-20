"use client";

import { BottomSheet } from "@/components/common/sheet";
import { IconCheck } from "@/components/icons";
import { RANKING_SORT_OPTIONS } from "@/lib/ranking/format";
import type { RankingSort } from "@/lib/ranking/types";
import { cn } from "@/lib/utils";

/*
 * 2-2 점수 순위(정렬 고르기) — 아래에서 올라오는 시트 「정렬」. 4줄, 지금 고른 줄에 ✓.
 * 줄을 누르면 바로 닫히고 그 순서로 바뀐다(적용 버튼 없음). ✕·바깥을 누르면 그대로 닫힌다.
 * 「인기순」은 인기 자료가 생길 때까지 숨긴다(`RANKING_SORT_OPTIONS`).
 */
export function SortSheet({
  open,
  onOpenChange,
  sort,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: RankingSort;
  onSelect: (sort: RankingSort) => void;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="정렬">
      {/* 공통 시트의 내용 칸 아래 여백(16)을 그림 값(8)에 맞춘다 */}
      <ul className="-mb-2">
        {RANKING_SORT_OPTIONS.map((option) => {
          const selected = option.sort === sort;
          return (
            <li
              key={option.sort}
              // 줄 높이 52는 아래 선(1px)까지 포함한 값이다
              className="h-[52px] border-b border-[#ebedf0] last:border-b-0"
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSelect(option.sort);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex h-full w-full items-center justify-between text-left text-[16px] leading-6",
                  selected
                    ? "font-bold text-text-strong"
                    : "font-normal text-text-sub",
                )}
              >
                {option.label}
                {selected && (
                  <IconCheck aria-hidden className="text-icon-default" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
