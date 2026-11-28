"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import { logFilter } from "@/lib/logging/track";

import { type FilterTab, parseRankingFilters } from "./format";
import { NO_FILTERS, type RankingFilters } from "./model";

const FILTER_LOG_TYPE = {
  sellers: "seller",
  brands: "brand",
  nutrients: "nutrient",
} as const;

/** 새로 건 값마다 필터 로그 한 건(뺀 값 · 그대로 둔 값은 보내지 않는다) */
export function addedFilters(before: RankingFilters, after: RankingFilters) {
  return (Object.keys(FILTER_LOG_TYPE) as (keyof RankingFilters)[]).flatMap(
    (tab) =>
      (after[tab] as string[])
        .filter((value) => !(before[tab] as string[]).includes(value))
        .map((value) => ({
          filterType: FILTER_LOG_TYPE[tab],
          filterValue: value,
        })),
  );
}

/**
 * 2-2 순위 화면(중분류 하나 · 대분류 전체)의 필터 상태: 걸린 필터, 열린 시트의 탭, 초기화 뒤 포커스를 받을 판매처 칩.
 * 걸린 필터는 라우터의 지금 주소에서 읽는다(뒤로 와서 다시 붙을 때 서버 값은 라우터 캐시의 것이고,
 * window.location은 화면을 옮기는 중엔 아직 이전 주소다). 주소에 다시 쓰는 일은 화면이 맡는다(다른 값과 함께 쓰므로)
 */
export function useRankingFilters(onApply?: () => void) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<RankingFilters>(() =>
    parseRankingFilters(
      searchParams.getAll("seller"),
      searchParams.getAll("brand"),
      searchParams.getAll("nutrient"),
    ),
  );
  const [tab, setTab] = useState<FilterTab | null>(null);
  const sellerChip = useRef<HTMLButtonElement>(null);

  const apply = (next: RankingFilters) => {
    addedFilters(filters, next).forEach(logFilter);
    setFilters(next);
    onApply?.();
  };

  return {
    filters,
    apply,
    /** 누른 「초기화」가 사라지므로 포커스를 첫 칩(판매처)으로 옮긴다 */
    reset: () => {
      apply(NO_FILTERS);
      sellerChip.current?.focus();
    },
    /** 열린 필터 시트의 탭. 닫혀 있으면 null */
    tab,
    open: setTab,
    close: () => setTab(null),
    sellerChip,
  };
}
