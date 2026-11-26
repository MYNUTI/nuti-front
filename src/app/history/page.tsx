import type { Metadata } from "next";

import { TabBar } from "@/components/common/tab-bar";

import { fixtureHistory } from "./_fixtures";
import { groupByDay } from "./history-days";
import { HistoryHeader, type HistoryTab } from "./history-tabs";
import { RecentTab } from "./recent-tab";

export const metadata: Metadata = {
  title: "내 기록",
};

const BANDS = ["1", "2", "3", "4", "5"] as const;

/*
 * 기록 탭. `?tab=` 없음 — 4-1 최근 본 제품 · `saved` — 4-4 즐겨찾기 · `requests` — 4-3 분석 요청(09단계 다음 순서).
 * 4-1은 `?band=1~5`로 점수 구간을 거른다(점수 고르기 시트). 미리 보기 `?state=empty · error`
 */
export default async function HistoryPage({
  searchParams,
}: PageProps<"/history">) {
  const query = await searchParams;
  const tab: HistoryTab =
    query.tab === "saved" || query.tab === "requests" ? query.tab : "recent";
  const band = BANDS.find((b) => b === query.band);
  const state = typeof query.state === "string" ? query.state : undefined;

  const now = new Date();
  const all = state === "empty" ? [] : fixtureHistory(now);
  // 메모: 구간으로 거르면 「점수 없음」 제품은 빠진다
  const shown = band
    ? all.filter((item) => item.score?.band === Number(band))
    : all;

  return (
    <main className="flex flex-1 flex-col bg-bg-page pt-safe pb-[calc(57px+var(--safe-bottom))]">
      <HistoryHeader tab={tab} />
      {tab === "recent" ? (
        <RecentTab
          state={state === "error" ? "error" : all.length ? "ok" : "empty"}
          band={band ? (Number(band) as 1 | 2 | 3 | 4 | 5) : null}
          count={shown.length}
          // 거르기 전 목록 기준(구간을 바꿔도 화면을 다시 그리지 않아 ♡ 상태가 이어진다)
          initialSaved={all.filter((i) => i.saved).map((i) => i.id)}
          groups={groupByDay(shown, now)}
          goalLabel="다이어트"
        />
      ) : (
        <p className="px-5 py-10 text-center text-body2 text-text-sub">
          {tab === "saved" ? "4-4 즐겨찾기" : "4-3 분석 요청"}은 09단계 다음
          순서에서 만들어요.
        </p>
      )}
      <TabBar />
    </main>
  );
}
