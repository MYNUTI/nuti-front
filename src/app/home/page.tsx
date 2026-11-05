import type { Metadata } from "next";

import { SearchFieldLink } from "@/components/common/search-field";
import { TabBar } from "@/components/common/tab-bar";
import { Toast } from "@/components/common/toast";

import {
  FIXTURE_COMPARE_LEFT,
  FIXTURE_GOAL,
  FIXTURE_POPULAR,
  FIXTURE_RECENT,
  type Goal,
} from "./_fixtures";
import { GoalCardEmpty, GoalCardGuest, GoalCardUsing } from "./goal-card";
import { HomeGuide } from "./home-guide";
import { RecentError } from "./recent-error";
import {
  CategorySection,
  CompareBanner,
  PopularSection,
  RequestSection,
  SellerSection,
} from "./home-sections";

export const metadata: Metadata = { title: "홈" };

function Band() {
  return <div aria-hidden className="h-2 bg-bg-band" />;
}

// 2-1 홈
export default async function HomePage({ searchParams }: PageProps<"/home">) {
  /*
   * API 연결 전 미리보기용 주소 값. 연결하면 목표·최근 본 제품을 서버에서 받아 정한다.
   *   ?goal=diet|muscle — 1-5에서 넘긴 목표
   *   ?state=using|loading|error — 목표 카드 상태(없으면 첫 방문)
   *   ?state=compare — 사용 중 + 비교함 남음 안내
   *   ?state=guest — 로그인 안 함(최근 본 제품 1개 이상)
   *   ?state=deleted — 계정 삭제 뒤: 첫 방문 카드 + 알림 「계정을 삭제했어요」
   */
  const { goal: goalParam, guide, state } = await searchParams;
  const goal: Goal =
    goalParam === "muscle" || goalParam === "diet" ? goalParam : FIXTURE_GOAL;

  return (
    <>
      <main className="flex flex-col bg-bg-page pt-safe pb-[calc(80px+var(--safe-bottom))]">
        <h1 className="sr-only">홈</h1>
        <div className="px-5 pt-2 pb-4">
          <SearchFieldLink
            href="/search"
            placeholder="제품명, 브랜드로 검색"
            data-guide="search"
          />
        </div>
        {state === "using" || state === "compare" ? (
          <GoalCardUsing goal={goal} summary={FIXTURE_RECENT} />
        ) : state === "loading" ? (
          <GoalCardUsing goal={goal} />
        ) : state === "guest" ? (
          <GoalCardGuest goal={goal} />
        ) : state === "error" ? (
          <RecentError />
        ) : (
          <GoalCardEmpty goal={goal} />
        )}
        {state === "compare" && <CompareBanner left={FIXTURE_COMPARE_LEFT} />}
        <Band />
        <CategorySection />
        <Band />
        <PopularSection products={FIXTURE_POPULAR} />
        <Band />
        <SellerSection />
        <Band />
        <RequestSection />
      </main>
      <TabBar />
      {guide === "1" && <HomeGuide goal={goal} />}
      {state === "deleted" && <Toast message="계정을 삭제했어요" />}
    </>
  );
}
