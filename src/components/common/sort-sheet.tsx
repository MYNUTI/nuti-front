"use client";

import { BottomSheet } from "@/components/common/sheet";
import { IconCheck } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 정렬 고르기 시트(【최종】 2-2 점수 순위(정렬 고르기) — 2-2 · 2-4가 같은 시트를 쓴다). 「정렬」, 줄마다 높이 52,
 * 고른 줄은 굵은 글자 + ✓. 줄을 누르면 바로 닫히고 그 순서로 바뀐다(적용 버튼 없음). ✕ · 바깥은 그대로 닫힌다.
 * `review/v3-rankings`의 시트를 옮겨 공통으로 뺐다. 4-1 「점수별로 보기」도 같은 시트에 제목 · 줄 앞 색 점만 바꿔 쓴다.
 */
export function SortSheet<T extends string>({
  title = "정렬",
  open,
  onOpenChange,
  options,
  value,
  onSelect,
}: {
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** mark: 이름 앞 표시(4-1 점수 구간 색 점) */
  options: { value: T; label: string; mark?: React.ReactNode }[];
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
      {/* 공통 시트의 내용 칸 아래 여백(16)을 그림 값(8)에 맞춘다 */}
      <ul className="-mb-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <li
              key={option.value}
              // 줄 높이 52는 아래 선(1px)까지 포함한 값이다
              className="h-[52px] border-b border-[#ebedf0] last:border-b-0"
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSelect(option.value);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex h-full w-full items-center justify-between text-left",
                  selected
                    ? "text-body1-bold text-text-strong"
                    : "text-body1 text-text-sub",
                )}
              >
                <span className="flex items-center gap-2">
                  {option.mark}
                  {option.label}
                </span>
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
