"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Coachmark } from "@/components/common/coachmark";

import type { Goal } from "./_fixtures";

/*
 * 2-1g 홈 가이드 1/2·2/2. 1-5 목표 선택 바로 뒤 홈 위에 띄운다.
 * 피그마 메모: 1/2는 스캔 버튼, 2/2는 검색칸만 밝힌다.
 * 피그마 메모에는 밝힌 자리를 누르면 그 기능으로 간다고 되어 있지만, 가이드 중에는 누르지 않게 했다(11-04 결정).
 * 건너뛰기·시작하기·Esc는 가이드를 닫고 홈(첫 방문)을 그대로 보인다.
 * 단계마다 key를 달리해 2/2로 넘어갈 때 초점을 새 말풍선으로 다시 옮긴다.
 */
export function HomeGuide({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const close = () => router.replace(`/home?goal=${goal}`, { scroll: false });

  const linkClass = "text-body2-bold text-brand-link";

  if (step === 1) {
    return (
      <Coachmark
        key="scan"
        onClose={close}
        target="scan"
        shape="circle"
        padding={6}
        placement="above"
        title="여기를 눌러 바코드를 찍어요"
        body="궁금한 제품 하나로 시작해 보세요."
        actions={
          <>
            <button
              type="button"
              onClick={close}
              className="text-body2-medium text-text-sub"
            >
              건너뛰기
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={linkClass}
            >
              다음
            </button>
          </>
        }
      />
    );
  }

  return (
    <Coachmark
      key="search"
      onClose={close}
      target="search"
      shape="rounded"
      padding={4}
      placement="below"
      tailOffset={32}
      title="바코드가 없으면 이름으로 찾아요"
      body={"제품명, 브랜드로 검색해도\n같은 등급을 볼 수 있어요."}
      actions={
        <button type="button" onClick={close} className={linkClass}>
          시작하기
        </button>
      }
    />
  );
}
