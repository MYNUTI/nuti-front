"use client";

import { Dialog, Tabs } from "radix-ui";
import { useRef, useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { CheckboxMark } from "@/components/common/check-mark";
import { Chip } from "@/components/common/chip";
import { IconClose } from "@/components/icons";

import type { RankingFilters, Seller } from "./_fixtures";
import { SELLER_OPTIONS, sellerLabel } from "./format";

export type FilterTab = "seller" | "brand" | "nutrient";

export const FILTER_TAB_LABEL: Record<FilterTab, string> = {
  seller: "판매처",
  brand: "브랜드",
  nutrient: "영양성분",
};

/** 탭마다 【최종】 화면 이름. 아직 안 붙인 곳의 알림에 쓴다 */
export const FILTER_TAB_SCREEN: Record<FilterTab, string> = {
  seller: "2-5b 필터(판매처)",
  brand: "2-5 필터(브랜드)",
  nutrient: "2-5 필터(영양성분)",
};

const TABS = (Object.keys(FILTER_TAB_LABEL) as FilterTab[]).map((value) => ({
  value,
  label: FILTER_TAB_LABEL[value],
}));

/*
 * 2-5 · 2-5b 필터(【최종】 ⑥ 9306:17693 · 18378 · 9311:32240) — 화면을 덮는 전체 시트. 위 「필터」 + ✕, 탭 3칸,
 * 탭 내용, 아래 고른 조건 칩 + 「초기화」 · 「n개 제품 보기」.
 * 고르는 동안은 시트 안에서만 바뀌고 「n개 제품 보기」를 눌러야 순위에 걸린다. ✕ · 뒤로는 고른 것을 버리고 닫는다.
 * 「초기화」 · 조건 칩 ✕는 시트 안의 고른 것만 지운다(2-5b 고르기 전으로).
 * 결과가 0개여도 버튼은 누를 수 있다(【최종】 메모).
 */
export function RankingFilterSheet({
  open,
  onOpenChange,
  tab: initialTab,
  applied,
  countFor,
  sellerCounts,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 연 칩의 탭 */
  tab: FilterTab;
  /** 지금 순위에 걸린 필터. 열 때마다 여기서 시작한다 */
  applied: RankingFilters;
  /** 시트에서 고른 조건의 제품 수(「n개 제품 보기」) */
  countFor: (filters: RankingFilters) => number;
  sellerCounts: Partial<Record<Seller, number>>;
  onApply: (filters: RankingFilters) => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(applied);
  // BottomSheet와 같은 이유(Trigger 없이 open으로만 연다)로 연 순간의 포커스 요소를 기억했다가 돌려준다
  const returnFocus = useRef<HTMLElement | null>(null);

  const toggleSeller = (seller: Seller) =>
    setDraft((d) => ({
      ...d,
      sellers: d.sellers.includes(seller)
        ? d.sellers.filter((s) => s !== seller)
        : SELLER_OPTIONS.map((o) => o.value).filter(
            (s) => s === seller || d.sellers.includes(s),
          ),
    }));
  const count = countFor(draft);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed-app inset-y-0 z-50 flex flex-col bg-bg-page pt-safe outline-none"
          onOpenAutoFocus={() => {
            returnFocus.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            if (!returnFocus.current?.isConnected) return;
            event.preventDefault();
            returnFocus.current.focus();
          }}
        >
          <div className="relative flex h-13 shrink-0 items-center justify-center">
            <Dialog.Title className="text-body1-bold text-text-strong">
              필터
            </Dialog.Title>
            <Dialog.Close
              aria-label="닫기"
              className="absolute right-1 flex size-12 items-center justify-center text-icon-default"
            >
              <IconClose />
            </Dialog.Close>
          </div>

          <Tabs.Root
            value={tab}
            onValueChange={(value) => setTab(value as FilterTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <Tabs.List
              aria-label="필터 종류"
              className="flex shrink-0 border-b border-line-default"
            >
              {TABS.map((t) => (
                <Tabs.Trigger
                  key={t.value}
                  value={t.value}
                  className="flex h-12 flex-1 items-center justify-center text-body1-medium text-text-sub data-[state=active]:-mb-px data-[state=active]:border-b-2 data-[state=active]:border-text-strong data-[state=active]:text-body1-bold data-[state=active]:text-text-strong"
                >
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content
              value="seller"
              className="min-h-0 flex-1 overflow-y-auto outline-none"
            >
              <ul className="pt-3 pb-1">
                {SELLER_OPTIONS.map(({ value, label }) => (
                  <li key={value}>
                    <label className="flex cursor-pointer items-center gap-3 py-3 pr-5 pl-5">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={draft.sellers.includes(value)}
                        onChange={() => toggleSeller(value)}
                      />
                      <CheckboxMark className="peer-focus-visible:rounded-[6px] peer-focus-visible:outline-2 peer-focus-visible:outline-text-strong" />
                      <span className="min-w-0 flex-1 text-body1 text-text-body">
                        {label}
                      </span>
                      <span className="shrink-0 text-body2 text-text-sub">
                        {(sellerCounts[value] ?? 0).toLocaleString("ko-KR")}개
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </Tabs.Content>
            {/* 브랜드 · 영양성분 탭은 07단계 다음 순서에서 붙인다 */}
            {(["brand", "nutrient"] as const).map((value) => (
              <Tabs.Content
                key={value}
                value={value}
                className="min-h-0 flex-1 overflow-y-auto outline-none"
              >
                <p className="px-5 py-10 text-center text-body2 text-text-sub">
                  아직 만들지 않은 화면이에요: {FILTER_TAB_SCREEN[value]}
                </p>
              </Tabs.Content>
            ))}
          </Tabs.Root>

          <BottomCta
            className="border-t border-line-default"
            chips={
              draft.sellers.length > 0 &&
              draft.sellers.map((seller) => (
                <Chip
                  key={seller}
                  kind="removable"
                  selected
                  onClick={() => toggleSeller(seller)}
                >
                  {sellerLabel(seller)}
                </Chip>
              ))
            }
          >
            <Button
              kind="tertiary"
              className="px-5"
              onClick={() => setDraft((d) => ({ ...d, sellers: [] }))}
            >
              초기화
            </Button>
            <Button
              kind="primary"
              className="flex-1"
              onClick={() => {
                onApply(draft);
                onOpenChange(false);
              }}
            >
              {count.toLocaleString("ko-KR")}개 제품 보기
            </Button>
          </BottomCta>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
