"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Dialog, Tabs } from "radix-ui";
import { useEffect, useRef, useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { Chip } from "@/components/common/chip";
import { IconClose } from "@/components/icons";
import { rankingQueries } from "@/lib/ranking/queries";

import {
  NO_FILTERS,
  NUTRIENT_CHIPS,
  type NutrientFilter,
  type RankingFilters,
  type Seller,
} from "./model";
import {
  FILTER_TAB_LABEL,
  type FilterTab,
  nutrientLabel,
  SELLER_OPTIONS,
  sellerLabel,
} from "./format";
import { BrandMore } from "./ranking-brand-more";
import { CheckLine } from "./ranking-frame";

const TABS = (Object.keys(FILTER_TAB_LABEL) as FilterTab[]).map((value) => ({
  value,
  label: FILTER_TAB_LABEL[value],
}));

/*
 * 2-5 · 2-5b 필터(【최종】 ⑥ 2-5b 9306:17693 · 18378 · 9311:32240, 2-5 브랜드 17879 · 18414) — 화면을 덮는 전체 시트.
 * 위 「필터」 + ✕, 탭 3칸, 탭 내용, 아래 고른 조건 칩 + 「초기화」 · 「n개 제품 보기」.
 * 고르는 동안은 시트 안에서만 바뀌고 「n개 제품 보기」를 눌러야 순위에 걸린다. ✕ · 뒤로는 고른 것을 버리고 닫는다.
 * 「초기화」는 시트 안의 고른 것을 모두(탭 셋) 지우고(메모에 없어 임시로 정함, 남은 질문 34), 조건 칩 ✕는 그 값만 뺀다.
 * 결과가 0개여도 버튼은 누를 수 있다(【최종】 메모).
 * 수는 고른 조건으로 서버가 센다(`GET /rankings/filters`, 고를 때마다 다시 부르고 새 수가 올 때까지 앞 수를 둔다).
 * 첫 화면(종류를 고르지 않았을 때)은 서버가 종류(`category`)를 꼭 받아 수를 셀 수 없다(UI 남은 질문 38). 그래서 판매처 ·
 * 영양성분은 정해진 목록에서 수 없이 고르고, 브랜드 탭은 안내만 두고, 버튼은 「적용하기」다(그림 없음, API 플랜 「남은 질문」).
 * 수를 아직 못 받았을 때(불러오는 중 · 실패)도 같은 모양이다.
 */
export function RankingFilterSheet({
  open,
  onOpenChange,
  tab: initialTab,
  category,
  categoryName,
  applied,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 연 칩의 탭 */
  tab: FilterTab;
  /** 지금 순위의 칩 · 대분류 코드. 첫 화면(종류를 고르지 않았을 때)은 null */
  category: string | null;
  /** 지금 순위의 종류 이름(2-5e 「○○ 브랜드, 가나다순」) */
  categoryName: string;
  /** 지금 순위에 걸린 필터. 열 때마다 여기서 시작한다 */
  applied: RankingFilters;
  onApply: (filters: RankingFilters) => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(applied);
  // BottomSheet와 같은 이유(Trigger 없이 open으로만 연다)로 연 순간의 포커스 요소를 기억했다가 돌려준다
  const returnFocus = useRef<HTMLElement | null>(null);
  // 2-5e 브랜드 더 보기는 시트 안에서 넘어가는 화면이다
  const [brandMore, setBrandMore] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const backFromMore = useRef(false);
  // 2-5e에서 돌아오면 「브랜드 더 보기」로 포커스를 돌려준다
  useEffect(() => {
    if (brandMore || !backFromMore.current) return;
    backFromMore.current = false;
    moreButton.current?.focus();
  }, [brandMore]);

  const sheetQuery = useQuery({
    ...rankingQueries.filters(category ?? "", draft),
    enabled: category !== null,
    placeholderData: keepPreviousData,
  });
  const sheet = sheetQuery.data ?? null;
  // 2-5e 목록: 그 종류의 전체 브랜드와 수(다른 필터와 상관없다). 브랜드 더 보기를 열 때 부른다
  const brandQuery = useQuery({
    ...rankingQueries.brands(category ?? ""),
    enabled: category !== null && brandMore,
  });
  const brandList = brandQuery.data?.items ?? null;

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
  const topBrands = sheet?.brands.top ?? [];
  const brandRows = [
    ...topBrands,
    // 위 8개 밖 브랜드의 수는 시트 응답에 없어 2-5e 목록(그 종류 전체 수)에서 읽고, 아직 없으면 수 없이 둔다
    ...keptBrands
      .filter((name) => !topBrands.some((b) => b.name === name))
      .map((name) => ({
        name,
        count: brandList?.find((b) => b.name === name)?.count,
      })),
  ];

  const toggleNutrient = (nutrient: NutrientFilter) =>
    setDraft((d) => ({
      ...d,
      nutrients: d.nutrients.includes(nutrient)
        ? d.nutrients.filter((n) => n !== nutrient)
        : NUTRIENT_CHIPS.map((c) => c.code).filter(
            (n) => n === nutrient || d.nutrients.includes(n),
          ),
    }));

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
    ...draft.nutrients.map((nutrient) => ({
      key: `nutrient-${nutrient}`,
      label: nutrientLabel(nutrient),
      remove: () => toggleNutrient(nutrient),
    })),
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed-app inset-y-0 z-50 flex flex-col bg-bg-page pt-safe outline-none"
          onEscapeKeyDown={(event) => {
            // 2-5e에서 Esc는 ‹처럼 브랜드 탭으로 돌아간다(시트 전체를 닫으면 고른 것이 모두 버려진다)
            if (!brandMore) return;
            event.preventDefault();
            backFromMore.current = true;
            setBrandMore(false);
          }}
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
          {brandMore ? (
            <BrandMore
              categoryName={categoryName}
              brands={
                brandList && [
                  ...brandList,
                  // 그 종류에 없는 브랜드가 주소로 들어와 골라져 있어도 보이고 풀 수 있게 0개 줄로 둔다
                  ...draft.brands
                    .filter((name) => !brandList.some((b) => b.name === name))
                    .map((name) => ({ name, count: 0 })),
                ]
              }
              failed={brandQuery.isError}
              onRetry={() => void brandQuery.refetch()}
              selected={draft.brands}
              onToggle={toggleBrand}
              onBack={() => {
                backFromMore.current = true;
                setBrandMore(false);
              }}
            />
          ) : (
            <>
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
                        count={
                          sheet?.sellers.find((seller) => seller.code === value)
                            ?.count
                        }
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
                  {category === null && (
                    <p className="px-5 pt-4 text-body2 text-text-sub">
                      종류를 고르면 브랜드로 거를 수 있어요
                    </p>
                  )}
                  {category !== null && !sheet && (
                    // 실패 문장 · 다시 시도는 그림이 없다(API 플랜 「남은 질문」)
                    <div className="flex items-center gap-1 px-5 pt-4">
                      <p role="status" className="text-body2 text-text-sub">
                        {sheetQuery.isError
                          ? "브랜드를 불러오지 못했어요"
                          : "불러오는 중"}
                      </p>
                      {sheetQuery.isError && (
                        <Button
                          kind="text"
                          size="S"
                          onClick={() => void sheetQuery.refetch()}
                        >
                          다시 시도
                        </Button>
                      )}
                    </div>
                  )}
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
                  {/* 「전체 n개」 · 버튼은 2-5e가 보일 목록(그 종류 전체)으로 센다. 판매처로 거른 수로 세면
                      판매처를 고른 뒤 버튼이 사라져 2-5e에 못 들어간다(남은 질문 35) */}
                  {sheet && sheet.brands.totalBrands > topBrands.length && (
                    <button
                      ref={moreButton}
                      type="button"
                      onClick={() => setBrandMore(true)}
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
                  <div className="flex flex-col gap-3 px-5 pt-4 pb-2">
                    {/* 그 종류에서 해당 제품이 너무 적거나 많은 칩은 서버가 숨긴다(hidden) */}
                    <div className="flex flex-wrap gap-2">
                      {(sheet?.nutrients ?? NUTRIENT_CHIPS)
                        // 수를 모르면(첫 화면 · 불러오는 중) 숨길지 몰라 칩을 다 보인다.
                        // 열 때 이미 걸려 있던 칩(다른 종류에서 이어 옴 · 주소로 들어옴)은 이 종류에서 숨김이어도
                        // 보이고 풀 수 있게 둔다. 시트를 연 동안은 풀어도 남아 포커스를 잃지 않는다
                        .filter(
                          (chip) =>
                            !("hidden" in chip && chip.hidden) ||
                            applied.nutrients.includes(chip.code),
                        )
                        .map((chip) => (
                          <Chip
                            key={chip.code}
                            selected={draft.nutrients.includes(chip.code)}
                            onClick={() => toggleNutrient(chip.code)}
                          >
                            {chip.label}
                          </Chip>
                        ))}
                    </div>
                    {/* 고른 칩의 기준 숫자. 여럿이면 칩 순서대로 한 줄씩(그림은 하나만, 남은 질문 36) */}
                    {draft.nutrients.length > 0 && (
                      <div className="rounded-md bg-bg-field px-3.5 py-3 text-body2 text-text-body">
                        {draft.nutrients.map((code) => {
                          const chip = (
                            sheet?.nutrients ?? NUTRIENT_CHIPS
                          ).find((c) => c.code === code)!;
                          return (
                            <p key={code}>
                              {chip.label}: {chip.rule}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="px-5 py-3 text-body2 text-text-sub">
                    식약처 표시 기준과 같아요
                  </p>
                </Tabs.Content>
              </Tabs.Root>

              <BottomCta
                className="border-t border-line-default"
                // 2-5 메모: 영양성분 칩을 2개 이상 고르면 버튼 위에 한 줄. 공통 BottomCta는 이 줄을 조건 칩 위에 둔다
                note={
                  draft.nutrients.length > 1 &&
                  "고른 조건 중 하나라도 맞는 제품"
                }
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
                  onClick={() => setDraft(NO_FILTERS)}
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
                  {sheet
                    ? `${sheet.count.toLocaleString("ko-KR")}개 제품 보기`
                    : "적용하기"}
                </Button>
              </BottomCta>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
