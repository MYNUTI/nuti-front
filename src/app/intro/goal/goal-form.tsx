"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { SelectCard } from "@/components/common/select-card";

/*
 * 1-5 목표 카드 2장. 디자인 메모(11-04 회의): 카드를 눌러도 바로 넘어가지 않고 「다음」으로 넘어간다.
 * 그림이 다이어트를 고른 상태라 다이어트를 먼저 골라 둔다(설명 「잘 모르겠으면 다이어트로 시작해 보세요」).
 * 목표 저장은 API 브랜치(온보딩)에서 붙인다. 지금은 홈에 목표(goal)와 2-1g 가이드를 띄우라는 표시(guide)만 넘긴다.
 */
const GOALS = [
  {
    value: "diet",
    title: "다이어트",
    description: "100g당 칼로리가 낮을수록\n등급이 높아요",
    image: "/intro/goal-diet.png",
    size: 1020,
  },
  {
    value: "muscle",
    title: "근육 증가",
    description: "100g당 칼로리가 높을수록\n등급이 높아요",
    image: "/intro/goal-muscle.png",
    size: 840,
  },
] as const;

type Goal = (typeof GOALS)[number]["value"];

/** 선택 상태를 「다음」 링크와 함께 쓰려고 본문(main)과 아래 버튼을 같이 그린다. header는 main 안 맨 위에 놓인다 */
export function GoalForm({ header }: { header: React.ReactNode }) {
  const [goal, setGoal] = useState<Goal>("diet");

  return (
    <>
      <main className="flex flex-1 flex-col">
        {header}
        <fieldset className="flex flex-col gap-3 px-5">
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
      </main>
      <BottomCta>
        <Button className="flex-1" asChild>
          <Link href={`/home?goal=${goal}&guide=1`}>다음</Link>
        </Button>
      </BottomCta>
    </>
  );
}
