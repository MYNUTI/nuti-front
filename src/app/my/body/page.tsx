import type { Metadata } from "next";

import { toGoal } from "@/app/my/to-goal";

import { FIXTURE_BODY_PROFILE } from "./_fixtures";
import { EMPTY_BODY_INPUT, toBodyInput } from "./body-input";
import { BodyScreen, type BodyMode } from "./body-screen";

export const metadata: Metadata = { title: "내 몸에 맞추기" };

/*
 * 5-7 내 몸에 맞추기 · 5-7b 계산 결과 · 5-7c 지우기 확인(【최종】). 홈 「AI 영양 진단」 배너, 5-1 「내 몸에 맞추기」 줄, 5-6b 「내 몸에 맞추기」,
 * 5-6c 「다음」(몸 정보에 동의했을 때 · `?signup=1&goal=`)에서 온다.
 */
export default async function Page({ searchParams }: PageProps<"/my/body">) {
  /*
   * 가입 중은 `?signup=1&goal=`(5-6c가 보낸다). 그 밖에는 미리보기 주소 값이고, API를 붙이면 로그인 · 몸 정보 동의 · 저장한 값으로 정한다:
   *   (없음) 로그인 전 · ?state=login 로그인 후 동의 전 · ?state=consented 동의한 뒤 처음 입력 · ?state=saved 이미 맞췄을 때
   * `?step=result`는 5-7b 계산 결과. 「계산하기」가 붙이고, 계산한 값이 화면 안에 없으면(새로 고침 등) 입력으로 돌아간다
   */
  const { state, signup, goal, step } = await searchParams;
  const mode: BodyMode =
    signup === "1"
      ? "signup"
      : state === "login"
        ? "consent"
        : state === "consented"
          ? "input"
          : state === "saved"
            ? "saved"
            : "guest";

  return (
    <BodyScreen
      mode={mode}
      // 가입 중 · 처음 입력은 빈 칸. 이 기기에 몸 정보가 있으면 채워 두는 것(메모)은 기기 저장을 붙일 때 한다
      initial={
        mode === "saved" ? toBodyInput(FIXTURE_BODY_PROFILE) : EMPTY_BODY_INPUT
      }
      goal={mode === "signup" ? toGoal(goal) : undefined}
      step={step === "result" ? "result" : undefined}
    />
  );
}
