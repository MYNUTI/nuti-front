import type { Metadata } from "next";

import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";

import { FIXTURE_GOAL } from "../_fixtures";
import { toGoal } from "../to-goal";
import { GoalPicker } from "./goal-picker";
import { toGoalNextPath } from "./next-path";

export const metadata: Metadata = { title: "목표 바꾸기" };

/*
 * 5-2 목표 바꾸기(【최종】). 5-1 「내 목표」 · 홈 · 검색 결과 · 랭킹의 「목표: ○○」에서 온다.
 * 뒤로(‹)는 들어온 화면으로 돌아간다(메모: 5-1에서 왔으면 5-1, 홈 · 검색 결과 · 랭킹에서 왔으면 그 화면).
 */
export default async function Page({ searchParams }: PageProps<"/my/goal">) {
  /*
   * 주소 값
   *   ?goal=diet|muscle — 지금 목표. 기기 저장소가 생기기 전까지 들어온 화면이 넘긴다(없으면 fixture)
   *   ?next= — 바꾼 뒤 돌아갈 홈 · 검색 결과 · 랭킹 주소. 없으면 5-1
   * 미리보기: ?state=synced — 로그인하고 「목표 계정 저장」에 동의한 사람(아래 글이 「이 기기와 계정에」)
   */
  const { goal: goalParam, next, state } = await searchParams;
  const goal = toGoal(goalParam) ?? FIXTURE_GOAL;

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-safe">
      <TopBar title="목표 바꾸기" left={<BackButton fallbackHref="/my" />} />
      <main className="flex flex-col">
        <h2 className="px-5 pt-2 pb-8 text-title1 text-text-strong">
          어떤 목표로 볼까요?
        </h2>
        <GoalPicker goal={goal} next={toGoalNextPath(next)} />
        <p className="px-5 pt-4 text-body2 text-text-sub">
          단백질, 당류, 나트륨은 두 목표 모두 같은 기준으로 봐요.
        </p>
        <p className="px-5 pt-4 text-body2 text-text-sub">
          목표는 {state === "synced" ? "이 기기와 계정에" : "이 기기에"}{" "}
          저장돼요.
          <br />
          바꿔도 기록과 즐겨찾기는 지워지지 않아요.
        </p>
      </main>
    </div>
  );
}
