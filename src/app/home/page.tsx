import type { Metadata } from "next";

import { SearchFieldLink } from "@/components/common/search-field";
import { TabBar } from "@/components/common/tab-bar";

import { FIXTURE_GOAL, FIXTURE_POPULAR, type Goal } from "./_fixtures";
import { HomeGuide } from "./home-guide";
import {
  CategorySection,
  GoalCardEmpty,
  PopularSection,
  RequestSection,
  SellerSection,
} from "./home-sections";

export const metadata: Metadata = { title: "홈" };

function Band() {
  return <div aria-hidden className="h-2 bg-bg-band" />;
}

// 2-1 홈(첫 방문). 사용 중·비교함·로그인 상태는 이어지는 화면 작업에서 더한다
export default async function HomePage({ searchParams }: PageProps<"/home">) {
  // 목표 저장은 API 연결 때 붙인다. 그 전까지 1-5에서 넘긴 ?goal=로 목표 카드를 바꿔 볼 수 있게 한다
  const { goal: goalParam, guide } = await searchParams;
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
        <GoalCardEmpty goal={goal} />
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
    </>
  );
}
