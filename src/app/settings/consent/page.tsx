import type { Metadata } from "next";

import { FIXTURE_GOAL } from "@/app/my/_fixtures";

import { ConsentScreen } from "./consent-screen";

export const metadata: Metadata = { title: "동의 관리" };

/*
 * 5-5b 동의 관리(【최종】). 5-5 설정의 「개인정보 › 동의 관리」에서 온다. 뒤로(‹)는 5-5.
 * 로그인 전에는 토글 3개가 흐리고 「로그인하기」가 있다(무엇을 눌러도 5-6a). 로그인 후에는 토글로 켜고 끈다.
 */
export default async function Page({
  searchParams,
}: PageProps<"/settings/consent">) {
  /*
   * 미리보기: ?state=login — 로그인 후. 처음 값은 【최종】 그림대로 목표 저장 켬 · 몸 정보 켬 · 광고성 정보 꺼짐.
   * API를 붙이면 로그인 상태와 동의 값을 서버에서 받는다(`GET /me/settings` 등)
   */
  const { state } = await searchParams;
  return (
    <ConsentScreen
      loggedIn={state === "login"}
      initial={{ goalSave: true, body: true, ads: false }}
      goal={FIXTURE_GOAL}
    />
  );
}
