import type { Metadata } from "next";

import { FIXTURE_GOAL } from "@/app/my/_fixtures";
import { toGoal } from "@/app/my/to-goal";
import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";

import { SignupGoalForm } from "./signup-goal-form";

export const metadata: Metadata = { title: "목표 고르기" };

/*
 * 5-6c 목표 고르기(가입 중, 【최종】). 5-6 가입 동의 다음에 모든 가입자가 본다. 뒤로(‹)는 5-6.
 */
export default async function Page({ searchParams }: PageProps<"/login/goal">) {
  /*
   * 주소 값(5-6이 넘긴다. 가입 API를 붙이면 동의 값은 서버에 저장하고 목표는 `GET /me/goal`로 읽는다)
   *   ?goal=diet|muscle|none — 이 기기의 목표. none이면 고른 카드 없이(목표가 없을 때). 없으면 fixture(다이어트)
   *   ?save=1 — 목표 계정 저장에 동의함(「다음」에서 계정에도 저장)
   *   ?body=1 — 몸 정보에 동의함(「다음」 → 5-7 내 몸에 맞추기(가입 중), 아니면 5-6b 연결 완료)
   *   ?ads=1 — 광고성 정보 수신에 동의함(들어올 때 날짜 알림)
   */
  const { goal, save, body, ads } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar left={<BackButton fallbackHref="/login/agree" />} />
      <SignupGoalForm
        goal={goal === "none" ? undefined : (toGoal(goal) ?? FIXTURE_GOAL)}
        saveToAccount={save === "1"}
        bodyConsent={body === "1"}
        adsConsent={ads === "1"}
      />
    </div>
  );
}
