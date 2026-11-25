import type { Metadata } from "next";

import { LoginScreen } from "./login-screen";

export const metadata: Metadata = { title: "로그인" };

/*
 * 5-6a 로그인(【최종】). 로그인이 필요한 곳(5-1 로그인 카드 · 알림 띠 「로그인」, 5-5b, 4-4 · 4-1e · 4-4e, 5-7 「가입하고 맞추기」,
 * 2-1 홈)에서 온다. ✕는 들어온 화면으로 돌아간다.
 */
export default async function Page({ searchParams }: PageProps<"/login">) {
  /*
   * 주소 값
   *   ?error=1 — 소셜 로그인을 취소했거나 실패해 돌아왔을 때(⑩ 상태표: 버튼 위 안내 문장)
   * 소셜 로그인 시작 주소 · 콜백은 API 플랜 11단계 답을 받은 뒤 붙인다.
   */
  const { error } = await searchParams;
  return <LoginScreen failed={error === "1"} />;
}
