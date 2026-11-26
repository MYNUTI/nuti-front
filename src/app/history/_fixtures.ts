/*
 * 09단계 내 기록 임시 데이터. 줄은 3-2 · 3-6 fixture 제품을 그대로 써서 눌러 들어간 화면과 점수가 맞게 한다.
 * API 연결 때 `GET /me/history`(제품당 하루 한 줄, 20개씩)로 바꾼다.
 */
import type { ScoreBand } from "@/components/common/score-ring";

import { FIXTURE_NO_SCORE } from "../contribute/_fixtures";
import { FIXTURE_PRODUCTS } from "../product/[id]/_fixtures";

export type HistoryItem = {
  /** 줄 키 · 즐겨찾기 키 */
  id: string;
  brand: string | null;
  name: string;
  image: string | null;
  /** null = 점수 없음(3-6으로 감) */
  score: { value: number; band: ScoreBand } | null;
  href: string;
  /** 줄 아래 글자 링크(점수 중간 이하 → 3-4 · 점수 없음 → 3-7) */
  more: { label: string; href: string } | null;
  saved: boolean;
  viewedAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function scored(id: string, daysAgo: number, saved: boolean, now: Date) {
  const p = FIXTURE_PRODUCTS[id];
  // 메모: 「점수가 중간 이하인 줄 아래 "더 맞는 제품 n개"」
  const better = p.band >= 3 && p.better.length > 0;
  return {
    id,
    brand: p.brand,
    name: p.name,
    image: p.image?.src ?? null,
    score: { value: p.score, band: p.band },
    href: `/product/${id}`,
    more: better
      ? {
          label: `더 맞는 제품 ${p.better.length}개`,
          href: `/product/${id}/better`,
        }
      : null,
    saved,
    viewedAt: new Date(now.getTime() - daysAgo * DAY_MS).toISOString(),
  } satisfies HistoryItem;
}

function noScore(id: string, daysAgo: number, saved: boolean, now: Date) {
  const p = FIXTURE_NO_SCORE[id];
  return {
    id,
    brand: p.brand,
    name: p.name,
    image: p.image,
    score: null,
    href: `/contribute/product/${id}`,
    more: {
      label: "영양성분표 찍고 점수 보기",
      href: `/contribute/label?product=${id}`,
    },
    saved,
    viewedAt: new Date(now.getTime() - daysAgo * DAY_MS).toISOString(),
  } satisfies HistoryItem;
}

/**
 * 【최종】 4-1 그림의 네 줄(오늘 2 · 어제 2). 최근 본 순서.
 * 미리 보기 주소 값 ?state=empty — 아직 없을 때 · error — 불러오지 못했을 때
 */
export function fixtureHistory(now: Date): HistoryItem[] {
  return [
    scored("4", 0, true, now),
    scored("5", 0, true, now),
    scored("11", 1, true, now),
    noScore("p2", 1, false, now),
  ];
}
