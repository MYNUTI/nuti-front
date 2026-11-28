"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { SelectCard } from "@/components/common/select-card";

import type { Goal } from "../_fixtures";
import { GOAL_CARDS } from "../goals";
import { goalPickerFrom } from "./next-path";
import { usePickGoal } from "./use-pick-goal";

/*
 * 5-2 목표 카드 2장. 1-5와 같은 카드 · 그림이지만 【최종】 5-2는 기본 모양(초록 동그라미 + 테두리)이고 설명 문장이 다르다.
 * 다른 카드를 누르면 「다음」 없이 바로 바꾼다(메모). 기기(동의한 로그인 계정이면 계정에도)에 저장하고 들어온 화면으로 돌아간다.
 * 5-1로 돌아가면 바꾸기 전 목표(?from=)로 알림 「(목표)로 바꿨어요 · 되돌리기」를 띄운다.
 */
export function GoalPicker({ goal, next }: { goal: Goal; next?: string }) {
  const router = useRouter();
  const pickGoal = usePickGoal("5-2");

  function change(to: Goal) {
    pickGoal(to, goalPickerFrom(next));
    // 5-2를 방문 기록에서 빼 돌아간 화면에서 뒤로 가기가 5-2로 오지 않게 한다
    router.replace(next ?? `/my?from=${goal}`);
  }

  return (
    // ph-no-capture: 화면 기록(PostHog)에서 고른 목표가 보이지 않게 통째로 가린다(1-5와 같음)
    <fieldset className="ph-no-capture flex flex-col gap-3 px-5">
      <legend className="sr-only">목표</legend>
      {GOAL_CARDS.map((g) => (
        <SelectCard
          key={g.value}
          name="goal"
          value={g.value}
          checked={goal === g.value}
          onChange={() => change(g.value)}
          // 【최종】: 고른 카드 테두리는 link 색 50%, 카드 높이는 두 장 모두 124 이상
          className="min-h-31 has-checked:border-brand-link/50"
          title={
            <span className="flex items-center gap-2">
              {g.title}
              {goal === g.value && (
                <span className="rounded-[6px] border border-brand-link bg-bg-page px-2 py-[3px] text-caption-bold text-brand-link">
                  지금 목표
                </span>
              )}
            </span>
          }
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
  );
}
