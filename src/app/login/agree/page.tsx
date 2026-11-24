import type { Metadata } from "next";

import { toGoal } from "@/app/my/to-goal";
import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";

import { AgreeForm } from "./agree-form";

export const metadata: Metadata = { title: "가입 동의" };

/*
 * 5-6 가입 동의(【최종】). 5-6a에서 처음 가입하는 계정으로 로그인한 뒤 온다. 뒤로(‹)는 5-6a.
 */
export default async function Page({
  searchParams,
}: PageProps<"/login/agree">) {
  /*
   * 주소 값
   *   ?goal=diet|muscle — 이 기기의 목표. 없으면(공유 링크로 처음 온 사람) 목표 줄에 목표 이름을 쓰지 않는다
   * 미리보기: ?state=failed — 가입 처리가 실패해 돌아왔을 때(체크는 그대로, 문장만). 가입 API를 붙이면 화면 안 상태로 바꾼다
   */
  const { goal, state } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar left={<BackButton fallbackHref="/login" />} />
      <AgreeForm goal={toGoal(goal)} failed={state === "failed"} />
    </div>
  );
}
