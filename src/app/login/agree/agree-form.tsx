"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import type { Goal } from "@/app/my/_fixtures";
import { GOAL_LABEL } from "@/app/my/goals";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { CheckRow } from "@/components/common/check-row";
import { ConfirmSheet } from "@/components/common/sheet";
import {
  BodyConsentSheet,
  GoalSaveConsentSheet,
} from "@/components/consent/consent-sheets";

const REQUIRED = ["age", "terms", "privacy"] as const;
type RequiredKey = (typeof REQUIRED)[number];

type Checks = Record<RequiredKey | "ads" | "goalSave" | "body", boolean>;

const NONE: Checks = {
  age: false,
  terms: false,
  privacy: false,
  ads: false,
  goalSave: false,
  body: false,
};

// bodyFromSkip: 「맞춤형 영양 점수를 받을 수 없어요」 시트의 「몸 정보 동의 보기」로 연 몸 정보 시트(동의하면 바로 다음 화면)
type Sheet = "goalSave" | "body" | "bodyFromSkip" | "skipBody" | null;

/*
 * 5-6 동의 줄과 「동의하고 시작하기」. 메모 규칙:
 * - 전체 동의 = 필수 3개 + 광고성 정보. 목표 저장 · 몸 정보는 각 줄의 시트에서 「동의하기」를 눌러야 켜진다
 * - 필수가 꺼져 있으면 첫 꺼진 필수 줄로 스크롤 + 빨간 문장(만 14세가 꺼져 있으면 그 문장만)
 * - 몸 정보가 꺼져 있으면 「맞춤형 영양 점수를 받을 수 없어요」를 한 번만 띄운다(필수 문장이 먼저)
 * 가입 API가 생기기 전이라 「시작하기」는 고른 값만 5-6c에 주소로 넘긴다.
 */
export function AgreeForm({
  goal,
  failed,
}: {
  goal: Goal | undefined;
  failed: boolean;
}) {
  const router = useRouter();
  const [checks, setChecks] = useState<Checks>(NONE);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [skipBodyShown, setSkipBodyShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const rowRefs = useRef<Partial<Record<RequiredKey, HTMLInputElement | null>>>(
    {},
  );

  const allOn = REQUIRED.every((key) => checks[key]) && checks.ads;

  function set(key: keyof Checks, value: boolean) {
    setChecks((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function toggleAll() {
    const next = !allOn;
    setChecks((prev) => ({
      ...prev,
      age: next,
      terms: next,
      privacy: next,
      ads: next,
    }));
    setError(null);
  }

  // 선택 동의 줄은 켤 때만 시트를 거친다. 끌 때는 바로 끈다
  function toggleSheetRow(key: "goalSave" | "body") {
    if (checks[key]) set(key, false);
    else setSheet(key);
  }

  function start(body: boolean) {
    const params = new URLSearchParams();
    // 목표가 없는 사람도 5-6c에서 「목표가 없을 때」로 보이게 none을 넘긴다
    params.set("goal", goal ?? "none");
    if (checks.goalSave) params.set("save", "1");
    if (body) params.set("body", "1");
    // 다음 화면 위 알림 「(날짜) 마이뉴티 광고성 정보 수신에 동의했어요」(법 의무)
    if (checks.ads) params.set("ads", "1");
    router.push(`/login/goal?${params}`);
  }

  function submit() {
    const firstOff = REQUIRED.find((key) => !checks[key]);
    if (firstOff) {
      setError(
        checks.age
          ? "필수 항목에 동의해야 가입할 수 있어요."
          : "만 14세 이상만 가입할 수 있어요.",
      );
      const input = rowRefs.current[firstOff];
      input?.closest("div")?.scrollIntoView({ block: "center" });
      input?.focus({ preventScroll: true });
      return;
    }
    if (!checks.body && !skipBodyShown) {
      setSkipBodyShown(true);
      setSheet("skipBody");
      return;
    }
    start(checks.body);
  }

  const requiredRow = (key: RequiredKey, text: string, detailHref?: string) => (
    <CheckRow
      ref={(el) => {
        rowRefs.current[key] = el;
      }}
      checked={checks[key]}
      onChange={(e) => set(key, e.target.checked)}
      aria-invalid={error !== null && !checks[key]}
      aria-describedby={error !== null && !checks[key] ? errorId : undefined}
      detailHref={detailHref}
      label={
        <>
          <b>[필수]</b> {text}
        </>
      }
    />
  );

  return (
    <>
      <main className="flex flex-1 flex-col pb-4">
        <div className="flex flex-col gap-2 px-5 pt-2 pb-6">
          <h1 className="text-title1 text-text-strong">마이뉴티 이용 동의</h1>
          <p className="text-body1 text-text-sub">
            필수 항목에 동의하면 가입이 끝나요.
            <br />
            선택 항목은 동의하지 않아도
            <br />
            스캔, 점수, 비교를 그대로 쓸 수 있어요.
          </p>
        </div>

        <CheckRow
          checked={allOn}
          onChange={toggleAll}
          label={<b>필수 항목과 광고성 정보 수신에 동의</b>}
        />
        <p className="pr-5 pb-2 pl-14 text-body2 text-text-sub">
          목표와 몸 정보 저장은 각 줄에서 따로 골라요.
        </p>
        <div aria-hidden className="mx-5 h-px bg-line-default" />

        <div className="flex flex-col py-2">
          {requiredRow("age", "만 14세 이상입니다")}
          {requiredRow("terms", "이용약관 동의", "/terms")}
          {requiredRow("privacy", "개인정보 수집 · 이용 동의", "/privacy")}
          <p className="pr-5 pb-2 pl-14 text-body2 text-text-sub">
            이메일, 닉네임, 계정 식별자
          </p>
          {error && (
            <p
              id={errorId}
              role="alert"
              className="px-5 pb-2 text-body2 text-text-danger"
            >
              {error}
            </p>
          )}

          <div aria-hidden className="h-3" />
          <CheckRow
            checked={checks.goalSave}
            onChange={() => toggleSheetRow("goalSave")}
            onDetailClick={() => setSheet("goalSave")}
            // 두 줄 글이라 체크 · 보기를 첫 줄에 맞춘다(【최종】)
            className="items-start [&>label]:items-start"
            label={
              <>
                <b>[선택]</b>{" "}
                {goal ? (
                  <>
                    고른 목표({GOAL_LABEL[goal]})를
                    <br />
                    계정에 저장
                  </>
                ) : (
                  "고른 목표를 계정에 저장"
                )}
              </>
            }
          />
          <CheckRow
            checked={checks.body}
            onChange={() => toggleSheetRow("body")}
            onDetailClick={() => setSheet("body")}
            label={
              <>
                <b>[선택]</b> 몸 정보 수집 · 이용(민감정보)
              </>
            }
          />
          <CheckRow
            checked={checks.ads}
            onChange={(e) => set("ads", e.target.checked)}
            // 광고성 정보 수신 내용은 개인정보 처리방침에서 본다(2026-11-25 결정)
            detailHref="/privacy"
            label={
              <>
                <b>[선택]</b> 광고성 정보 수신
              </>
            }
          />
        </div>
      </main>

      <BottomCta
        className="sticky bottom-0"
        note={
          failed ? (
            // note는 BottomCta가 <p>로 감싼다
            <span
              role="alert"
              className="text-body2 break-keep text-text-danger"
            >
              가입을 마치지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.
            </span>
          ) : undefined
        }
      >
        <Button className="flex-1" onClick={submit}>
          동의하고 시작하기
        </Button>
      </BottomCta>

      <GoalSaveConsentSheet
        open={sheet === "goalSave"}
        onOpenChange={(open) => !open && setSheet(null)}
        goalLabel={goal && GOAL_LABEL[goal]}
        onAgree={() => set("goalSave", true)}
      />
      <BodyConsentSheet
        open={sheet === "body" || sheet === "bodyFromSkip"}
        onOpenChange={(open) => !open && setSheet(null)}
        onAgree={() => {
          set("body", true);
          // 「몸 정보 없이 시작할 때」 시트에서 넘어와 동의했으면 그대로 다음 화면으로(메모). 그 시트는 필수를 다 켠 뒤에만
          // 뜨고 떠 있는 동안 줄을 바꿀 수 없어, 이 경로에서는 필수가 켜져 있다. 줄에서 직접 연 시트는 켜기만 한다
          if (sheet === "bodyFromSkip") start(true);
        }}
      />
      <ConfirmSheet
        open={sheet === "skipBody"}
        onOpenChange={(open) => !open && setSheet(null)}
        dismissible
        title="맞춤형 영양 점수를 받을 수 없어요"
        description={
          "몸 정보에 동의하지 않으면 다이어트 점수를\n기본(하루 2,000kcal 기준)으로 계산해요.\n나중에 내 정보에서 동의할 수 있어요."
        }
        cancelLabel="몸 정보 없이 시작"
        onCancel={() => start(false)}
        confirmLabel="몸 정보 동의 보기"
        // 시트 위에 시트를 띄우지 않는다. 이 시트가 닫힌 뒤 몸 정보 시트를 연다
        onConfirm={() => setTimeout(() => setSheet("bodyFromSkip"), 0)}
      />
    </>
  );
}
