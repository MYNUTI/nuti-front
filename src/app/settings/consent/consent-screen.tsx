"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Goal } from "@/app/my/_fixtures";
import { GOAL_LABEL } from "@/app/my/goals";
import { BackButton } from "@/components/common/back-button";
import { Button } from "@/components/common/button";
import { ListRow } from "@/components/common/list-row";
import { ConfirmSheet } from "@/components/common/sheet";
import { Toast } from "@/components/common/toast";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { adsConsentMessage } from "@/components/consent/ads-consent";
import {
  BodyConsentSheet,
  GoalSaveConsentSheet,
} from "@/components/consent/consent-sheets";
import { IconSearch } from "@/components/icons";

type Consents = { goalSave: boolean; body: boolean; ads: boolean };
type Key = keyof Consents;

/** 켤 때(goalSave · body는 알릴 4가지 시트) · 끌 때(철회 확인 시트) 띄우는 시트 */
type Sheet = { key: Key; action: "agree" | "revoke" } | null;

const ROW_LABEL: Record<Key, string> = {
  goalSave: "목표 저장(민감정보)",
  body: "몸 정보 수집 · 이용(민감정보)",
  ads: "광고성 정보 수신",
};

// 철회 확인 시트(5-5b 동의 철회 확인 · 목표 저장 철회 확인). 광고성 정보는 같은 틀이고 문장이 그림에 없다(UI 플랜 남은 질문 70)
const REVOKE: Record<
  Key,
  { title: string; description: string; confirm: string }
> = {
  goalSave: {
    title: "목표 저장 동의를 철회할까요?",
    description:
      "철회하면 계정에 저장한 목표가 바로 지워지고,\n점수는 이 기기에 저장한 목표로 계산해요.",
    confirm: "철회하고 지우기",
  },
  body: {
    title: "몸 정보 동의를 철회할까요?",
    description:
      "철회하면 계정과 이 기기에 저장한 몸 정보가 바로 지워지고,\n다이어트 점수는 기본 2,000kcal로 다시 계산해요.",
    confirm: "철회하고 지우기",
  },
  ads: {
    title: "광고성 정보 수신을 철회할까요?",
    description: "철회하면 앞으로 광고성 정보를 보내지 않아요.",
    // 지울 것이 없어 「지우기」를 뺀다
    confirm: "철회하기",
  },
};

const ROW_CLASS = "py-3.5";

export function ConsentScreen({
  loggedIn,
  initial,
  goal,
}: {
  loggedIn: boolean;
  initial: Consents;
  goal: Goal;
}) {
  const router = useRouter();
  // 동의 변경 API는 API 연결 때 붙인다. 지금은 화면 안 상태로만 바꾼다(UI 플랜 「데이터」)
  const [consents, setConsents] = useState(initial);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );

  function notify(message: string) {
    setToast((prev) => ({ id: (prev?.id ?? 0) + 1, message }));
  }

  function set(key: Key, on: boolean) {
    setConsents((prev) => ({ ...prev, [key]: on }));
    if (key === "ads") notify(adsConsentMessage(on));
    // 【최종】 메모: 실제로 철회했을 때만 「철회했어요」
    else if (!on) notify("철회했어요");
  }

  // 시트가 떠 있는 동안 스위치는 바꾸기 전 모습으로 둔다(메모). 그래서 바로 바꾸지 않고 시트를 띄운다
  function press(key: Key) {
    const on = consents[key];
    if (on) setSheet({ key, action: "revoke" });
    // 광고성 정보는 켤 때 설명 창 없이 바로 켠다
    else if (key === "ads") set("ads", true);
    else setSheet({ key, action: "agree" });
  }

  const closeSheet = (open: boolean) => !open && setSheet(null);
  const revoking = sheet?.action === "revoke" ? sheet.key : null;

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-safe">
      <TopBar
        title="동의 관리"
        left={
          <BackButton
            fallbackHref={loggedIn ? "/settings?state=login" : "/settings"}
          />
        }
        right={
          <TopBarButton asChild aria-label="검색">
            <Link href="/search">
              <IconSearch />
            </Link>
          </TopBarButton>
        }
      />

      {loggedIn ? (
        <main className="flex flex-col pb-1">
          <p className="px-5 pt-3.5 pb-1 text-body2 text-text-sub">
            끄면 계정에 저장한 목표나 몸 정보가 지워져요.
          </p>
          {(Object.keys(ROW_LABEL) as Key[]).map((key) => (
            <ListRow
              key={key}
              title={ROW_LABEL[key]}
              className={ROW_CLASS}
              toggle={{ checked: consents[key], onChange: () => press(key) }}
            />
          ))}
        </main>
      ) : (
        <main className="flex flex-col pb-2">
          <p className="px-5 pt-4 pb-1 text-body2 text-text-sub">
            로그인하면 동의를 바꿀 수 있어요.
          </p>
          <div className="px-5 py-2">
            <Button asChild kind="secondary" size="M" className="w-full">
              <Link href="/login">로그인하기</Link>
            </Button>
          </div>
          {/* 로그인 전에는 받은 동의가 없다. 흐린 줄 · 토글을 눌러도 5-6a 로그인(메모) */}
          {(Object.keys(ROW_LABEL) as Key[]).map((key) => (
            <ListRow
              key={key}
              title={ROW_LABEL[key]}
              className={`${ROW_CLASS} opacity-45`}
              toggle={{ checked: false, onChange: () => router.push("/login") }}
            />
          ))}
        </main>
      )}

      <GoalSaveConsentSheet
        open={sheet?.key === "goalSave" && sheet.action === "agree"}
        onOpenChange={closeSheet}
        goalLabel={GOAL_LABEL[goal]}
        onAgree={() => set("goalSave", true)}
      />
      <BodyConsentSheet
        open={sheet?.key === "body" && sheet.action === "agree"}
        onOpenChange={closeSheet}
        onAgree={() => set("body", true)}
      />
      <ConfirmSheet
        open={revoking !== null}
        onOpenChange={closeSheet}
        dismissible
        danger
        title={revoking ? REVOKE[revoking].title : ""}
        description={revoking ? REVOKE[revoking].description : undefined}
        cancelLabel="그대로 두기"
        confirmLabel={revoking ? REVOKE[revoking].confirm : ""}
        onConfirm={() => revoking && set(revoking, false)}
      />

      {toast && <Toast key={toast.id} message={toast.message} />}
    </div>
  );
}
