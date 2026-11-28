"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { SelectCard } from "@/components/common/select-card";
import { usePickGoal } from "@/app/my/goal/use-pick-goal";
import { logEvent } from "@/lib/logging/track";
import {
  isOnboardingCompletedLocally,
  rememberOnboardingCompleted,
} from "@/lib/onboarding/storage";

/*
 * 1-5 목표 카드 2장. 디자인 메모(11-04 회의): 카드를 눌러도 바로 넘어가지 않고 「이 목표로 시작」으로 넘어간다.
 * 그림이 다이어트를 고른 상태라 다이어트를 먼저 골라 둔다(카드 아래 안내 「고민되면 다이어트로 시작해 보세요」).
 * 카드 설명 문장은 산식 담당 확인 전이라 바뀔 수 있다(【최종】 메모 「안 정함」, CORE_002).
 * 「이 목표로 시작」은 목표를 기기(동의한 로그인 계정이면 계정에도)에 저장하고 온보딩 완료를 기기에 남긴 뒤(ONB_004),
 * 홈에 2-1g 가이드를 띄우라는 표시(guide)만 넘긴다. 목표는 주소로 넘기지 않는다(다음 화면이 기기 목표를 읽는다).
 * next가 있으면(3-2 공유 링크·목표 없음 「내 목표 고르기」) 가이드 없이 그 제품 결과로 돌아간다.
 */
const GOALS = [
  {
    value: "diet",
    title: "다이어트",
    description: "100g당 칼로리가 낮을수록\n칼로리 항목 점수가 높아요",
    image: "/intro/goal-diet.png",
    size: 1020,
  },
  {
    value: "muscle",
    title: "근육 증가",
    description: "단백질이 충분하면\n100g당 칼로리가 높을수록\n점수가 높아요",
    image: "/intro/goal-muscle.png",
    size: 840,
  },
] as const;

type Goal = (typeof GOALS)[number]["value"];

/** 선택 상태를 「이 목표로 시작」 링크와 함께 쓰려고 본문(main)과 아래 버튼을 같이 그린다. header는 카드 위, note는 카드 아래 */
export function GoalForm({
  header,
  note,
  next,
}: {
  header: React.ReactNode;
  note: React.ReactNode;
  /** 고른 뒤 돌아갈 제품 결과 주소 */
  next?: string;
}) {
  const [goal, setGoal] = useState<Goal>("diet");
  const pickGoal = usePickGoal("1-5");

  const start = () => {
    // 3-2 공유 링크 「내 목표 고르기」에서 왔으면 3-2, 아니면 0-4 소개
    pickGoal(goal, next ? "3-2" : "0-4");
    // 처음 마쳤을 때만. 첫 실행부터 걸린 시간(total_elapsed_ms)은 시작 시각을 남기는 곳이 없어 아직 보내지 않는다
    if (!isOnboardingCompletedLocally())
      logEvent("onboarding_complete", { screen: "1-5" });
    rememberOnboardingCompleted();
  };

  return (
    <>
      <main className="flex flex-1 flex-col">
        {header}
        {/* ph-no-capture: 화면 기록(PostHog)에서 고른 목표가 보이지 않게 통째로 가린다 */}
        <fieldset className="ph-no-capture flex flex-col gap-3 px-5">
          <legend className="sr-only">목표</legend>
          {GOALS.map((g) => (
            <SelectCard
              key={g.value}
              variant="soft"
              name="goal"
              value={g.value}
              checked={goal === g.value}
              onChange={() => setGoal(g.value)}
              title={g.title}
              description={
                <span className="whitespace-pre-line">{g.description}</span>
              }
              imageSize="L"
              image={
                <Image
                  src={g.image}
                  width={g.size}
                  height={g.size}
                  sizes="80px"
                  alt=""
                />
              }
            />
          ))}
        </fieldset>
        <p className="mt-3 px-5 text-body2 text-text-sub">{note}</p>
      </main>
      <BottomCta>
        <Button kind="lime" className="flex-1" asChild>
          <Link
            href={next ?? "/home?guide=1"}
            onClick={start}
            // 제품 결과로 돌아갈 때는 1-5를 방문 기록에서 빼, 뒤로 가기 한 번에 들어온 화면으로 간다
            replace={Boolean(next)}
          >
            이 목표로 시작
          </Link>
        </Button>
      </BottomCta>
    </>
  );
}
