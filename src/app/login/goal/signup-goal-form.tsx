"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import type { Goal } from "@/app/my/_fixtures";
import { GOAL_CARDS } from "@/app/my/goals";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { SelectCard } from "@/components/common/select-card";
import { Toast } from "@/components/common/toast";

/** 「11월 25일」. 알림 띠는 마운트 뒤에 그려 서버 · 브라우저 날짜가 달라도 hydration이 어긋나지 않는다 */
function todayLabel() {
  const now = new Date();
  return `${now.getMonth() + 1}월 ${now.getDate()}일`;
}

/*
 * 5-6c 목표 카드. 1-5 목표 선택과 같은 모양(soft 카드)이고 카드를 눌러도 바로 넘어가지 않는다. 설명 문장은 【최종】 5-6c대로.
 * 「다음」 → 고른 목표를 저장(API 연결 때 `PUT /me/goal`, 목표 계정 저장에 동의했으면 계정에도) →
 * 몸 정보에 동의했으면 5-7 내 몸에 맞추기(가입 중), 아니면 5-6b 연결 완료.
 */
export function SignupGoalForm({
  goal: initialGoal,
  bodyConsent,
  adsConsent,
}: {
  goal: Goal | undefined;
  /** 목표 계정 저장 동의. 저장 API를 붙일 때 쓴다 */
  saveToAccount: boolean;
  bodyConsent: boolean;
  adsConsent: boolean;
}) {
  const router = useRouter();
  const [goal, setGoal] = useState(initialGoal);
  const [missing, setMissing] = useState(false);
  const missingId = useId();

  function next() {
    if (!goal) {
      setMissing(true);
      // 무엇을 할지 바로 알게 첫 카드로 초점을 옮긴다(5-6 필수 줄과 같음)
      document.querySelector<HTMLInputElement>('input[name="goal"]')?.focus();
      return;
    }
    router.push(
      bodyConsent
        ? `/my/body?signup=1&goal=${goal}`
        : `/login/done?goal=${goal}`,
    );
  }

  return (
    <>
      <main className="flex flex-1 flex-col">
        <h1 className="px-5 pt-2 pb-4 text-title1 text-text-strong">
          어떤 목표로 볼까요?
        </h1>
        {missing && (
          <p
            id={missingId}
            role="alert"
            className="px-5 pb-3 text-body2 text-text-danger"
          >
            목표를 골라 주세요.
          </p>
        )}
        {/* ph-no-capture: 화면 기록(PostHog)에서 고른 목표가 보이지 않게 통째로 가린다(1-5와 같음) */}
        <fieldset
          aria-describedby={missing ? missingId : undefined}
          className="ph-no-capture flex flex-col gap-3 px-5"
        >
          <legend className="sr-only">목표</legend>
          {GOAL_CARDS.map((g) => (
            <SelectCard
              key={g.value}
              variant="soft"
              name="goal"
              value={g.value}
              checked={goal === g.value}
              onChange={() => {
                setGoal(g.value);
                setMissing(false);
              }}
              className="min-h-31"
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
        <p className="mt-3 px-5 text-body2 text-text-sub">
          단백질, 당류, 나트륨은 두 목표 모두 같은 기준으로 봐요.
          <br />
          고민되면 다이어트로 시작해 보세요.
          <br />내 정보에서 언제든 바꿀 수 있어요.
        </p>
      </main>
      <BottomCta className="sticky bottom-0">
        <Button className="flex-1" onClick={next}>
          다음
        </Button>
      </BottomCta>
      {/* 5-6에서 광고성 정보 수신에 동의했으면 다음 화면 위에 날짜를 알린다(법 의무, 【최종】 5-6 메모) */}
      {adsConsent && (
        <Toast
          message={`${todayLabel()} 마이뉴티 광고성 정보 수신에 동의했어요`}
          className="bottom-[calc(76px+var(--safe-bottom))]"
        />
      )}
    </>
  );
}
