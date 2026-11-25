"use client";

import Link from "next/link";
import { useState } from "react";

import type { LoginProvider } from "@/app/my/_fixtures";
import { PROVIDER_LABEL } from "@/app/my/providers";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { ListRow } from "@/components/common/list-row";
import { Toast } from "@/components/common/toast";
import { IconCheck } from "@/components/icons";

import type { MovedRecords } from "./_fixtures";

/** moved: 처음 가입하며 이 기기 기록을 옮김 · returning: 이미 가입한 계정이라 합침 · empty: 옮길 기록 없음 · move-failed: 옮기기 실패 */
export type DoneState = "moved" | "returning" | "empty" | "move-failed";

const SUBTITLE: Record<DoneState, string> = {
  moved: "이 기기의 기록을 계정으로 옮겼어요.",
  returning: "계정의 기록과 이 기기의 기록을 합쳤어요.",
  empty: "",
  "move-failed": "기록을 옮기지 못했어요. 다음에 열 때 다시 옮겨요.",
};

export function DoneScreen({
  provider,
  nickname,
  maskedEmail,
  records,
  state,
  fromBody,
}: {
  provider: LoginProvider;
  nickname: string;
  maskedEmail: string;
  records: MovedRecords;
  state: DoneState;
  fromBody: boolean;
}) {
  const [toastId, setToastId] = useState(0);
  const showRecords = state === "moved" || state === "returning";

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <main className="flex flex-1 flex-col">
        <div className="flex flex-col items-center gap-3 px-5 pt-[72px] pb-8 text-center">
          <span
            aria-hidden
            className="flex size-[72px] items-center justify-center rounded-full bg-brand-primary-weak text-brand-link"
          >
            <IconCheck className="size-9" />
          </span>
          <h1 className="text-title1 text-text-strong">
            {PROVIDER_LABEL[provider]} 계정으로{" "}
            {state === "returning" ? "다시 로그인했어요" : "연결했어요"}
          </h1>
          {SUBTITLE[state] && (
            <p className="text-body1 break-keep text-text-sub">
              {SUBTITLE[state]}
            </p>
          )}
        </div>

        <div className="px-5 pb-4">
          {/* 닉네임 · 이메일은 화면 기록(PostHog)에서 통째로 가린다(5-1 계정 줄과 같음) */}
          <dl className="ph-mask ph-sensitive flex flex-col gap-3.5 rounded-md bg-bg-tint p-5">
            <SummaryRow label="닉네임">{nickname}</SummaryRow>
            <SummaryRow label="이메일">{maskedEmail}</SummaryRow>
            {showRecords && (
              <SummaryRow
                label={state === "returning" ? "합친 기록" : "옮긴 기록"}
              >
                최근 본 제품 {records.recent}개,
                <br />
                즐겨찾기 {records.saved}개,
                <br />
                분석 요청 {records.requests}개
              </SummaryRow>
            )}
          </dl>
        </div>

        {/* 분석 완료 알림은 앱 출시 때 추가(RTN_008). 그때까지 켜지지 않고 알림 띠만 띄운다(5-1 로그인 후와 같음) */}
        <ListRow
          title="분석이 끝나면 알림 받기"
          toggle={{
            checked: false,
            onChange: () => setToastId((id) => id + 1),
          }}
        />
      </main>

      {fromBody ? (
        // 5-7 「가입하고 맞추기」로 시작했는데 몸 정보를 아직 넣지 않았으면 맞추기로 이어 준다
        <BottomCta
          className="sticky bottom-0"
          textAction={
            <Button asChild kind="text" size="M" className="w-full">
              <Link href="/history">내 기록 보기</Link>
            </Button>
          }
        >
          <Button asChild className="flex-1">
            {/* 가입을 마쳤으니 5-7 로그인 후 모양으로. 동의했는지는 API를 붙이면 5-7이 정한다 */}
            <Link href="/my/body?state=login">내 몸에 맞추기</Link>
          </Button>
        </BottomCta>
      ) : (
        <BottomCta className="sticky bottom-0">
          <Button asChild className="flex-1">
            <Link href="/history">내 기록 보기</Link>
          </Button>
        </BottomCta>
      )}

      {toastId > 0 && (
        <Toast
          key={toastId}
          className="bottom-[calc(76px+var(--safe-bottom))]"
          message={
            <span className="block text-center">
              알림은 준비 중이에요.
              <br />
              결과는 기록 › 분석 요청에서 볼 수 있어요.
            </span>
          }
        />
      )}
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <dt className="w-18 shrink-0 text-body2 text-text-sub">{label}</dt>
      <dd className="min-w-0 flex-1 text-body1-medium text-text-strong">
        {children}
      </dd>
    </div>
  );
}
