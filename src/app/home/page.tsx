import type { Metadata } from "next";

import { TabBar } from "@/components/common/tab-bar";
import { Toast } from "@/components/common/toast";
import { NoCameraSheet } from "@/components/scan/no-camera-sheet";

import {
  FIXTURE_COMPARE_NOTICE,
  FIXTURE_GOAL,
  FIXTURE_POPULAR,
  type Goal,
} from "./_fixtures";
import { CompareNotice, CompareNoticePreview } from "./compare-notice";
import { HomeGuide } from "./home-guide";
import {
  CategorySection,
  PopularSection,
  RequestSection,
  SearchSection,
  SellerSection,
} from "./home-sections";

export const metadata: Metadata = { title: "홈" };

function Band() {
  return <div aria-hidden className="h-2 bg-bg-band" />;
}

/*
 * 2-1 홈(【최종】). 목표 카드는 없다. 첫 방문 · 사용 중 · 로그인 안 함 · 계정 삭제가 모두 같은 배치이고,
 * 마지막 띠 자리만 다르다(첫 방문은 분석 요청 아래, 사용 중은 위).
 */
export default async function HomePage({ searchParams }: PageProps<"/home">) {
  /*
   * API 연결 전 미리보기용 주소 값. 연결하면 목표 · 사용 이력을 서버에서 받아 정한다.
   *   ?goal=diet|muscle — 1-5에서 넘긴 목표
   *   ?state=using — 사용 중(없으면 첫 방문)
   *   ?state=compare — 사용 중 + 비교함 안내 줄을 디자인 값으로 늘 띄움(실제 안내는 비교함 저장소로 정한다)
   *   ?state=deleted — 계정 삭제 뒤: 첫 방문 + 알림 「계정을 삭제했어요」
   * 미리보기가 아닌 값: ?sheet=no-camera — 스캔이 카메라를 못 여는 곳(앱 안 브라우저·PC)이라 보낸 안내 시트
   */
  const { goal: goalParam, guide, state, sheet } = await searchParams;
  const goal: Goal =
    goalParam === "muscle" || goalParam === "diet" ? goalParam : FIXTURE_GOAL;
  const using = state === "using" || state === "compare";

  return (
    <>
      <main className="flex flex-col bg-bg-page pt-safe pb-[calc(80px+var(--safe-bottom))]">
        <h1 className="sr-only">홈</h1>
        <SearchSection />
        {state === "compare" ? (
          <CompareNoticePreview notice={FIXTURE_COMPARE_NOTICE} />
        ) : (
          <CompareNotice />
        )}
        <CategorySection />
        <Band />
        <PopularSection goal={goal} products={FIXTURE_POPULAR} />
        <Band />
        <SellerSection />
        {using && <Band />}
        <RequestSection />
        {!using && <Band />}
      </main>
      <TabBar />
      {guide === "1" && <HomeGuide goal={goal} />}
      {state === "deleted" && <Toast message="계정을 삭제했어요" />}
      {sheet === "no-camera" && <NoCameraSheet closeHref="/home" />}
    </>
  );
}
