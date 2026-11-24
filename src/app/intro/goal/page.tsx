import type { Metadata } from "next";

import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";

import { GoalForm } from "./goal-form";
import { toNextPath } from "./next-path";

export const metadata: Metadata = { title: "목표 선택" };

// 1-5 목표 선택. 디자인 메모: 0-4 「건너뛰기」 또는 0-4b 「목표 고르기」에서 온다. 3-2 공유 링크·목표 없음의 「내 목표 고르기」에서도 온다(?next=)
export default async function Page({ searchParams }: PageProps<"/intro/goal">) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar left={<BackButton fallbackHref="/intro/by-goal" />} />
      <GoalForm
        next={toNextPath(next)}
        header={
          <h1 className="px-5 pt-2 pb-4 text-title1 text-text-strong">
            어떤 목표로 볼까요?
          </h1>
        }
        note={
          <>
            단백질, 당류, 나트륨은 두 목표 모두 같은 기준으로 봐요.
            <br />
            고민되면 다이어트로 시작해 보세요.
            <br />내 정보에서 언제든 바꿀 수 있어요.
          </>
        }
      />
    </div>
  );
}
