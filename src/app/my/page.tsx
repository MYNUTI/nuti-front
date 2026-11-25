import type { Metadata } from "next";

import { TabBar } from "@/components/common/tab-bar";

import {
  FIXTURE_ACCOUNT,
  FIXTURE_BODY_KCAL,
  FIXTURE_GOAL,
  FIXTURE_INQUIRY_URL,
  type MyInfo,
} from "./_fixtures";
import { MyScreen, type MyNotice } from "./my-screen";
import { toGoal } from "./to-goal";

export const metadata: Metadata = { title: "내 정보" };

/*
 * 5-1 내 정보(【최종】). 로그인 전 · 로그인 후 · 내 몸에 맞춘 뒤 · 목표를 바꾼 뒤가 모두 같은 배치이고,
 * 맨 위(로그인 권유 상자 ↔ 계정 줄)와 줄 값 · 알림 띠만 다르다.
 */
export default async function MyPage({ searchParams }: PageProps<"/my">) {
  /*
   * 주소 값. 기기 저장소 · API가 생기기 전까지 목표는 화면끼리 주소로 넘긴다(홈 ?goal=과 같음).
   *   ?goal=diet|muscle — 지금 목표(없으면 fixture)
   *   ?from=diet|muscle — 5-2에서 바꾸기 전 목표: 알림 「(목표)로 바꿨어요 · 되돌리기」
   * API 연결 전 미리보기용 값. 연결하면 로그인 상태 · 몸 정보를 서버에서 받는다.
   *   ?state=login — 로그인 후
   *   ?state=body — 로그인 후 + 내 몸에 맞춘 뒤(5-7b에서 돌아옴): 알림 「내 몸에 맞춰 점수를 다시 계산했어요」
   */
  const { state, goal: goalParam, from } = await searchParams;
  const goal = toGoal(goalParam) ?? FIXTURE_GOAL;
  const previous = toGoal(from);

  const info: MyInfo = {
    account: state === "login" || state === "body" ? FIXTURE_ACCOUNT : null,
    goal,
    bodyKcal: state === "body" ? FIXTURE_BODY_KCAL : null,
  };
  const notice: MyNotice | null =
    state === "body"
      ? { kind: "body" }
      : previous && previous !== goal
        ? { kind: "goal", previous }
        : null;

  return (
    <>
      <MyScreen info={info} notice={notice} inquiryUrl={FIXTURE_INQUIRY_URL} />
      <TabBar />
    </>
  );
}
