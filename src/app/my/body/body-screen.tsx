"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Goal } from "@/app/my/_fixtures";
import { BackButton } from "@/components/common/back-button";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { ConfirmSheet } from "@/components/common/sheet";
import { TopBar } from "@/components/common/top-bar";
import { BodyConsentSheet } from "@/components/consent/consent-sheets";

import { BodyForm, fieldName } from "./body-form";
import {
  BODY_FIELDS,
  type BodyErrors,
  type BodyInput,
  type BodyProfile,
  validateBody,
} from "./body-input";

/*
 * 5-7 내 몸에 맞추기의 모양(【최종】 6장 중 시트를 뺀 5장):
 *   guest — 로그인 전. 입력 칸 없이 안내 + 「가입하고 맞추기」
 *   consent — 로그인 후 몸 정보 동의 전. 안내 + 「동의하고 맞추기」(→ 동의 시트 → input)
 *   input — 동의한 뒤 처음 입력. 빈 칸 + 「계산하기」
 *   saved — 이미 맞췄을 때. 저장한 값 + 상단 「지우기」(→ 5-7c) + 「계산하기」
 *   signup — 가입 중(5-6c 다음). 「저장하고 시작하기」 + 「나중에 할게요」
 */
export type BodyMode = "guest" | "consent" | "input" | "saved" | "signup";

const BACK_FALLBACK: Record<Exclude<BodyMode, "signup">, string> = {
  guest: "/my",
  consent: "/my?state=login",
  input: "/my?state=login",
  // 「맞춘 뒤」 미리보기(?state=body)는 「다시 계산했어요」 알림을 띄워 쓰지 않는다
  saved: "/my?state=login",
};

function Head({
  title,
  description,
  headingRef,
}: {
  title: string;
  description: string;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="flex flex-col gap-2 px-5 pt-1 pb-4">
      <h2
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className="text-title1 whitespace-pre-line text-text-strong outline-none"
      >
        {title}
      </h2>
      <p className="text-body1 whitespace-pre-line text-text-sub">
        {description}
      </p>
    </div>
  );
}

/** 입력 칸 없는 안내(guest · consent). 마지막 줄 이름만 다르다 */
function Guide({ withoutLabel }: { withoutLabel: string }) {
  const rows = [
    {
      label: "맞추면 바뀌는 것",
      body: "다이어트 점수의 하루 칼로리 기준\n(기본 2,000kcal → 내 몸에 맞춘 값)",
    },
    {
      label: "그대로인 것",
      body: "근육 증가 점수,\n단백질, 당류, 나트륨 계산",
    },
    { label: withoutLabel, body: "스캔, 점수, 비교는 그대로 쓸 수 있어요" },
  ];
  return (
    <dl className="mx-5 flex flex-col gap-3 rounded-md bg-bg-tint p-4">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5">
          <dt className="text-[13px] leading-5 font-bold text-text-sub">
            {row.label}
          </dt>
          <dd className="text-[15px] leading-[23px] font-medium whitespace-pre-line text-text-strong">
            {row.body}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function BodyScreen({
  mode: initialMode,
  initial,
  goal,
}: {
  mode: BodyMode;
  initial: BodyInput;
  /** 가입 중(signup)일 때 5-6c에서 고른 목표. 5-6b로 이어 넘긴다 */
  goal?: Goal;
}) {
  const router = useRouter();
  // consent에서 동의하면 같은 화면에서 input으로 바뀐다
  const [mode, setMode] = useState(initialMode);
  const [input, setInput] = useState(initial);
  const [errors, setErrors] = useState<BodyErrors>({});
  const [sheet, setSheet] = useState<"consent" | "delete" | null>(null);
  // 동의하면 「동의하고 맞추기」 버튼이 사라져 시트가 초점을 돌려줄 곳이 없다. 새로 나온 입력 화면 제목으로 옮긴다
  const formHeading = useRef<HTMLHeadingElement>(null);
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    if (agreed && sheet === null) formHeading.current?.focus();
  }, [agreed, sheet]);

  const doneHref = goal ? `/login/done?goal=${goal}` : "/login/done";

  function change(patch: Partial<BodyInput>) {
    setInput((prev) => ({ ...prev, ...patch }));
    // 고친 칸의 오류 문장만 지운다
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch))
        delete next[key as keyof BodyErrors];
      return next;
    });
  }

  /** 버튼은 회색으로 막지 않고, 누르면 검사해 칸 아래 문장을 띄운다(메모) */
  function submit(onValid: (profile: BodyProfile) => void) {
    const result = validateBody(input);
    if (!result.ok) {
      setErrors(result.errors);
      const first = BODY_FIELDS.find((field) => result.errors[field]);
      if (first)
        document
          .querySelector<HTMLInputElement>(`[name="${fieldName(first)}"]`)
          ?.focus();
      return;
    }
    setErrors({});
    onValid(result.profile);
  }

  const form = mode === "input" || mode === "saved" || mode === "signup";

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar
        title="내 몸에 맞추기"
        left={
          <BackButton
            fallbackHref={
              mode === "signup"
                ? goal
                  ? `/login/goal?goal=${goal}`
                  : "/login/goal"
                : BACK_FALLBACK[mode]
            }
          />
        }
        right={
          mode === "saved" && (
            <Button kind="text" size="S" onClick={() => setSheet("delete")}>
              지우기
            </Button>
          )
        }
      />

      <main className="flex flex-1 flex-col">
        {mode === "guest" && (
          <>
            <Head
              title={"내 몸에 맞춘 점수는\n가입하고 볼 수 있어요"}
              description={
                "키, 체중, 활동량으로 하루 필요 칼로리를 계산해\n다이어트 점수를 맞춰요."
              }
            />
            <div className="pt-2">
              <Guide withoutLabel="가입이나 동의 없이도" />
            </div>
          </>
        )}
        {mode === "consent" && (
          <>
            <Head
              title={"몸 정보 동의를 켜면\n맞출 수 있어요"}
              description="동의한 몸 정보와 하루 필요 칼로리는 계정에 저장해요."
            />
            <div className="pt-2">
              <Guide withoutLabel="동의 없이도" />
            </div>
          </>
        )}
        {form && (
          <>
            <Head
              title="몸 정보를 알려 주세요"
              description="하루 필요 칼로리를 계산해 다이어트 점수에 맞춰요."
              headingRef={formHeading}
            />
            <BodyForm value={input} errors={errors} onChange={change} />
          </>
        )}
      </main>

      {mode === "guest" && (
        <BottomCta className="sticky bottom-0">
          {/* 가입 흐름(5-6a → 5-6 → 5-6c)을 거쳐 몸 정보에 동의했으면 가입 중 5-7로 돌아온다 */}
          <Button asChild className="flex-1">
            <Link href="/login">가입하고 맞추기</Link>
          </Button>
        </BottomCta>
      )}
      {mode === "consent" && (
        <BottomCta className="sticky bottom-0">
          <Button className="flex-1" onClick={() => setSheet("consent")}>
            동의하고 맞추기
          </Button>
        </BottomCta>
      )}
      {(mode === "input" || mode === "saved") && (
        <BottomCta className="sticky bottom-0">
          {/* 5-7b 계산 결과는 다음 단계에서 같은 주소에 `?step=result`로 붙인다(값은 화면 안 상태로만 넘김) */}
          <Button className="flex-1" onClick={() => submit(() => {})}>
            계산하기
          </Button>
        </BottomCta>
      )}
      {mode === "signup" && (
        <BottomCta
          className="sticky bottom-0"
          textAction={
            // 값 없이 5-6b로. 나중에 5-1 「내 몸에 맞추기」에서 맞춘다(메모)
            <Button asChild kind="text" size="M" className="w-full">
              <Link href={doneHref}>나중에 할게요</Link>
            </Button>
          }
        >
          {/* 값 · 칼로리 구간을 계정에 저장하는 API는 API 연결 때 붙인다. 지금은 5-6b로만 간다 */}
          <Button
            className="flex-1"
            onClick={() => submit(() => router.push(doneHref))}
          >
            저장하고 시작하기
          </Button>
        </BottomCta>
      )}

      <BodyConsentSheet
        open={sheet === "consent"}
        onOpenChange={(open) => !open && setSheet(null)}
        // 동의 기록 저장(동의 API)은 API 연결 때 붙인다
        onAgree={() => {
          setMode("input");
          setAgreed(true);
        }}
      />
      {/* 5-7c 내 몸에 맞춤(지우기 확인) */}
      <ConfirmSheet
        open={sheet === "delete"}
        onOpenChange={(open) => !open && setSheet(null)}
        dismissible
        danger
        title="내 몸에 맞춘 값을 지울까요?"
        description="이 기기에 저장한 몸 정보를 지우고 다이어트 점수를 기본 2,000kcal로 다시 계산해요. 계정에 저장한 몸 정보도 지우고 몸 정보 동의도 철회돼요."
        cancelLabel="그대로 두기"
        confirmLabel="철회하고 지우기"
        // 몸 정보 지우기 · 동의 철회 API와 이 기기 값 지우기는 API 연결 때 붙인다. 지금은 5-1(로그인 후, 기본 2,000kcal)로만 간다.
        // replace: 뒤로 가기로 지운 값이 채워진 5-7에 돌아오지 않게 한다
        onConfirm={() => router.replace("/my?state=login")}
      />
    </div>
  );
}
