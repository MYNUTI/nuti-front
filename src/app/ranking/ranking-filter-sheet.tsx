"use client";

import { Dialog, Tabs } from "radix-ui";
import { useRef, useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { CheckboxMark } from "@/components/common/check-mark";
import { Chip } from "@/components/common/chip";
import { IconClose } from "@/components/icons";

import type { fixtureFilterSheet, RankingFilters, Seller } from "./_fixtures";
import {
  FILTER_TAB_LABEL,
  FILTER_TAB_SCREEN,
  type FilterTab,
  SELLER_OPTIONS,
  sellerLabel,
} from "./format";
import { useNotBuiltNotice } from "./ranking-frame";

const TABS = (Object.keys(FILTER_TAB_LABEL) as FilterTab[]).map((value) => ({
  value,
  label: FILTER_TAB_LABEL[value],
}));

type FilterSheetData = ReturnType<typeof fixtureFilterSheet>;

/*
 * 2-5 · 2-5b 필터(【최종】 ⑥ 2-5b 9306:17693 · 18378 · 9311:32240, 2-5 브랜드 17879 · 18414) — 화면을 덮는 전체 시트.
 * 위 「필터」 + ✕, 탭 3칸, 탭 내용, 아래 고른 조건 칩 + 「초기화」 · 「n개 제품 보기」.
 * 고르는 동안은 시트 안에서만 바뀌고 「n개 제품 보기」를 눌러야 순위에 걸린다. ✕ · 뒤로는 고른 것을 버리고 닫는다.
 * 「초기화」는 시트 안의 고른 것을 모두(탭 셋) 지우고(메모에 없어 임시로 정함, 남은 질문 34), 조건 칩 ✕는 그 값만 뺀다.
 * 결과가 0개여도 버튼은 누를 수 있다(【최종】 메모).
 */
export function RankingFilterSheet({
  open,
  onOpenChange,
  tab: initialTab,
  applied,
  sheetFor,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 연 칩의 탭 */
  tab: FilterTab;
  /** 지금 순위에 걸린 필터. 열 때마다 여기서 시작한다 */
  applied: RankingFilters;
  /** 시트에서 고른 조건으로 센 탭마다의 수 · 「n개 제품 보기」 수(`GET /rankings/filters`) */
  sheetFor: (filters: RankingFilters) => FilterSheetData;
  onApply: (filters: RankingFilters) => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(applied);
  // BottomSheet와 같은 이유(Trigger 없이 open으로만 연다)로 연 순간의 포커스 요소를 기억했다가 돌려준다
  const returnFocus = useRef<HTMLElement | null>(null);
  // 시트가 화면을 덮어 알림도 시트 안에 그린다. 아래 띠(조건 칩 줄까지 약 136) 위에 띄운다
  const notBuilt = useNotBuiltNotice(
    "bottom-[calc(148px+max(var(--safe-bottom),12px))]",
  );

  const sheet = sheetFor(draft);

  const toggleSeller = (seller: Seller) =>
    setDraft((d) => ({
      ...d,
      sellers: d.sellers.includes(seller)
        ? d.sellers.filter((s) => s !== seller)
        : SELLER_OPTIONS.map((o) => o.value).filter(
            (s) => s === seller || d.sellers.includes(s),
          ),
    }));
  // 위 8개 밖 브랜드 줄은 시트를 연 동안 한 번 체크했으면 풀거나 초기화해도 남긴다
  // (줄이 사라지면 다시 고를 수 없고 그 체크박스에 있던 포커스도 잃는다)
  const [keptBrands, setKeptBrands] = useState(applied.brands);
  const toggleBrand = (brand: string) => {
    setKeptBrands((k) => (k.includes(brand) ? k : [...k, brand]));
    setDraft((d) => ({
      ...d,
      brands: d.brands.includes(brand)
        ? d.brands.filter((b) => b !== brand)
        : [...d.brands, brand],
    }));
  };

  // 2-5 메모: 2-5e에서 고르고 돌아오면 고른 브랜드가 체크된 채 — 위 8개에 없는 고른 브랜드는 그 뒤에 잇는다
  const brandRows = [
    ...sheet.brands.top,
    ...keptBrands
      .filter((name) => !sheet.brands.top.some((b) => b.name === name))
      .map((name) => ({ name, count: sheet.brands.counts[name] ?? 0 })),
  ];

  const chips = [
    ...draft.sellers.map((seller) => ({
      key: `seller-${seller}`,
      label: sellerLabel(seller),
      remove: () => toggleSeller(seller),
    })),
    ...draft.brands.map((brand) => ({
      key: `brand-${brand}`,
      label: brand,
      remove: () => toggleBrand(brand),
    })),
  ];

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
                  <CheckLine
                    key={value}
                    label={label}
                    count={sheet.sellers[value] ?? 0}
                    checked={draft.sellers.includes(value)}
                    onChange={() => toggleSeller(value)}
                  />
                ))}
              </ul>
            </Tabs.Content>

            <Tabs.Content
              value="brand"
              className="min-h-0 flex-1 overflow-y-auto outline-none"
            >
              <ul className="pt-3 pb-1">
                {brandRows.map(({ name, count }) => (
                  <CheckLine
                    key={name}
                    label={name}
                    count={count}
                    checked={draft.brands.includes(name)}
                    onChange={() => toggleBrand(name)}
                  />
                ))}
              </ul>
              {sheet.brands.totalBrands > sheet.brands.top.length && (
                <button
                  type="button"
                  // 2-5e 브랜드 더 보기는 07단계 다음 순서에서 붙인다
                  onClick={() => notBuilt.show("2-5e 필터(브랜드 더 보기)")}
                  className="w-full px-5 py-3 text-left text-body2-medium text-brand-link"
                >
                  브랜드 더 보기 (전체{" "}
                  {sheet.brands.totalBrands.toLocaleString("ko-KR")}개){" "}
                  <span aria-hidden>›</span>
                </button>
              )}
            </Tabs.Content>

            <Tabs.Content
              value="nutrient"
              className="min-h-0 flex-1 overflow-y-auto outline-none"
            >
              {/* 영양성분 탭은 07단계 다음 순서에서 붙인다 */}
              <p className="px-5 py-10 text-center text-body2 text-text-sub">
                아직 만들지 않은 화면이에요: {FILTER_TAB_SCREEN.nutrient}
              </p>
            </Tabs.Content>
          </Tabs.Root>

          <BottomCta
            className="border-t border-line-default"
            chips={
              chips.length > 0 &&
              chips.map(({ key, label, remove }) => (
                <Chip key={key} kind="removable" selected onClick={remove}>
                  {label}
                </Chip>
              ))
            }
          >
            <Button
              kind="tertiary"
              className="px-5"
              onClick={() => setDraft({ sellers: [], brands: [] })}
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
              {sheet.count.toLocaleString("ko-KR")}개 제품 보기
            </Button>
          </BottomCta>
          {notBuilt.element}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** 체크 + 이름 + 제품 수 한 줄(줄 전체를 누른다) */
function CheckLine({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 py-3 pr-5 pl-5">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={onChange}
        />
        <CheckboxMark className="peer-focus-visible:rounded-[6px] peer-focus-visible:outline-2 peer-focus-visible:outline-text-strong" />
        <span className="min-w-0 flex-1 text-body1 text-text-body">
          {label}
        </span>
        <span className="shrink-0 text-body2 text-text-sub">
          {count.toLocaleString("ko-KR")}개
        </span>
      </label>
    </li>
  );
}
