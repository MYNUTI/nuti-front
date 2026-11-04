import type { Metadata } from "next";

import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";

import { GoalForm } from "./goal-form";

export const metadata: Metadata = { title: "목표 선택" };

// 1-5 목표 선택. 디자인 메모: 0-4 「건너뛰기」 또는 0-4b 「목표 고르기」에서 온다
export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar left={<BackButton fallbackHref="/intro/2" />} />
      <GoalForm
        header={
          <div className="flex flex-col gap-2 px-5 pt-2 pb-8">
            <h1 className="text-title1 text-text-strong">
              어떤 목표로 볼까요?
            </h1>
            <p className="text-body1 text-text-sub">
              목표마다 칼로리를 보는 방향만 달라요.
              <br />
              잘 모르겠으면 다이어트로 시작해 보세요.
              <br />내 정보에서 언제든 바꿀 수 있어요.
            </p>
          </div>
        }
      />
    </div>
  );
}
