import type { Metadata } from "next";

import { TabBar } from "@/components/common/tab-bar";

import {
  fixtureHistory,
  fixtureNeedsLabel,
  fixtureRequests,
  fixtureSaved,
} from "./_fixtures";
import { groupByDay } from "./history-days";
import { HistoryHeader, type HistoryTab } from "./history-tabs";
import { HomeScreenPrompt } from "./home-screen-prompt";
import { RecentTab } from "./recent-tab";
import { RequestsTab } from "./requests-tab";
import { SavedTab } from "./saved-tab";

export const metadata: Metadata = {
  title: "내 기록",
};

const BANDS = ["1", "2", "3", "4", "5"] as const;

/*
 * 기록 탭. `?tab=` 없음 — 4-1 최근 본 제품 · `saved` — 4-4 즐겨찾기 · `requests` — 4-3 분석 요청(`&sent=request · photo`면 보낸 뒤 알림).
 * 4-1은 `?band=1~5`로 점수 구간을 거른다(점수 고르기 시트). 미리 보기 `?state=empty · error`, 홈 화면에 추가 시트 `?prompt=android · ios · samsung`
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
      ) : tab === "saved" ? (
        <SavedTab
          initialItems={state === "empty" ? [] : fixtureSaved()}
          goalLabel="다이어트"
          error={state === "error"}
        />
      ) : (
        <RequestsTab
          state={state === "error" ? "error" : "ok"}
          requests={state === "empty" ? [] : fixtureRequests()}
          needsLabel={fixtureNeedsLabel()}
          // 3-6 제품 요청하기(`request`) · 3-7x · 3-8 이 사진 그대로 보내기(`photo`)
          sent={
            query.sent === "request" || query.sent === "photo"
              ? query.sent
              : null
          }
        />
      )}
      <HomeScreenPrompt
        // 메모: 즐겨찾기나 본 제품이 1개 이상일 때만(빈 기록에는 띄우지 않음)
        hasItems={state !== "empty" && state !== "error"}
        preview={
          query.prompt === "android" ||
          query.prompt === "ios" ||
          query.prompt === "samsung"
            ? query.prompt
            : null
        }
      />
      <TabBar />
    </main>
  );
}
