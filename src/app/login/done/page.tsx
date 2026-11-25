import type { Metadata } from "next";

import type { LoginProvider } from "@/app/my/_fixtures";

import { FIXTURE_DONE } from "./_fixtures";
import { DoneScreen, type DoneState } from "./done-screen";

export const metadata: Metadata = { title: "연결 완료" };

const PROVIDERS: LoginProvider[] = ["kakao", "naver", "google"];

/*
 * 5-6b 연결 완료(【최종】). 가입이나 로그인이 끝났을 때 온다(5-6c 「다음」, 5-7(가입 중) 「저장하고 시작하기」 · 「나중에 할게요」,
 * 5-6a에서 이미 가입한 계정으로 로그인). 뒤로 가는 버튼은 없다.
 */
export default async function Page({ searchParams }: PageProps<"/login/done">) {
  /*
   * 주소 값
   *   ?provider=kakao|naver|google — 로그인한 곳(제목 「(카카오) 계정으로…」). 없으면 카카오
   *   ?from=body — 5-7 「가입하고 맞추기」로 시작한 가입인데 몸 정보를 넣지 않았을 때(동의 안 켬 · 나중에 할게요).
   *                아래 주 버튼이 「내 몸에 맞추기」(→ 5-7)가 된다
   *   ?goal= — 5-6c가 넘기지만 이 화면은 쓰지 않는다(목표 저장은 5-6c 「다음」에서 끝남). 쓰게 되면 `toGoal`로 거른다
   * 미리보기(로그인 API를 붙이면 응답으로 정한다)
   *   ?state=returning — 이미 가입한 계정으로 다시 로그인: 계정 기록과 합침
   *   ?state=empty — 옮길 기록이 없거나 이미 옮긴 기기: 「옮긴 기록」 줄을 숨김
   *   ?state=move-failed — 기록 옮기기 실패: 로그인은 끝내고 다음 실행 때 다시 옮김
   */
  const { provider, from, state } = await searchParams;
  const doneState: DoneState =
    state === "returning" || state === "empty" || state === "move-failed"
      ? state
      : "moved";

  return (
    <DoneScreen
      provider={PROVIDERS.find((p) => p === provider) ?? "kakao"}
      nickname={FIXTURE_DONE.nickname}
      maskedEmail={FIXTURE_DONE.maskedEmail}
      records={FIXTURE_DONE.records}
      state={doneState}
      fromBody={from === "body"}
    />
  );
}
