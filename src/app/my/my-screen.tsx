"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { ListRow } from "@/components/common/list-row";
import { Toast } from "@/components/common/toast";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconChevronRight, IconSearch, IconSettings } from "@/components/icons";

import type { Goal, LoginProvider, MyAccount, MyInfo } from "./_fixtures";

/** 들어올 때 띄울 알림 띠. body = 5-7b에서 맞춘 뒤, goal = 5-2에서 목표를 바꾼 뒤(previous로 되돌린다) */
export type MyNotice = { kind: "body" } | { kind: "goal"; previous: Goal };

const GOAL_LABEL: Record<Goal, string> = {
  diet: "다이어트",
  muscle: "근육 증가",
};

const PROVIDER_LABEL: Record<LoginProvider, string> = {
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
};

type ToastState = {
  // 같은 알림을 다시 띄울 때 새로 마운트하려고 센다(Toast는 떠 있는 채로 문장만 바꾸면 다시 뜨지 않는다)
  id: number;
  message: React.ReactNode;
  action?: "undo" | "login";
};

function Band() {
  return <div aria-hidden className="h-2 bg-bg-band" />;
}

function Divider() {
  return <div aria-hidden className="mx-5 h-px bg-line-default" />;
}

export function MyScreen({
  info,
  notice,
  inquiryUrl,
}: {
  info: MyInfo;
  notice: MyNotice | null;
  /** 문의하기 줄이 여는 주소(mailto:) */
  inquiryUrl: string;
}) {
  const router = useRouter();
  const [goal, setGoal] = useState(info.goal);
  const [toast, setToast] = useState<ToastState | null>(() => {
    if (notice?.kind === "body")
      return { id: 0, message: "내 몸에 맞춰 점수를 다시 계산했어요" };
    if (notice?.kind === "goal")
      return {
        id: 0,
        message: `${GOAL_LABEL[info.goal]}로 바꿨어요`,
        action: "undo",
      };
    return null;
  });

  const toastAction =
    toast?.action === "undo" && notice?.kind === "goal"
      ? {
          label: "되돌리기",
          // 【최종】 메모: 옛 목표로 다시 저장하고 5-1 내 정보. 저장은 API 연결 때 붙인다
          onClick: () => {
            setGoal(notice.previous);
            setToast(null);
            const params = new URLSearchParams(window.location.search);
            params.set("goal", notice.previous);
            params.delete("from");
            router.replace(`/my?${params}`, { scroll: false });
          },
        }
      : toast?.action === "login"
        ? { label: "로그인", onClick: () => router.push("/login") }
        : undefined;

  // 분석 완료 알림은 앱 출시 때 추가(RTN_008). 그때까지 알림 줄은 알림 띠만 띄운다
  function showNotifyToast() {
    setToast((prev) => {
      const id = (prev?.id ?? 0) + 1;
      return info.account
        ? {
            id,
            message: (
              <span className="block text-center">
                알림은 준비 중이에요.
                <br />
                결과는 기록 › 분석 요청에서 볼 수 있어요.
              </span>
            ),
          }
        : {
            id,
            message: (
              <>
                로그인하면 알림을 받을 수 있어요.
                <br />
                지금은 준비 중이에요.
              </>
            ),
            action: "login",
          };
    });
  }

  return (
    <>
      <main className="flex flex-col bg-bg-page pt-safe pb-[calc(80px+var(--safe-bottom))]">
        <TopBar
          root
          title="내 정보"
          right={
            <>
              <TopBarButton asChild aria-label="검색">
                <Link href="/search">
                  <IconSearch />
                </Link>
              </TopBarButton>
              <TopBarButton asChild aria-label="설정">
                <Link href="/settings">
                  <IconSettings />
                </Link>
              </TopBarButton>
            </>
          }
        />

        {info.account ? <AccountRow account={info.account} /> : <LoginPrompt />}

        <Band />
        <ValueLinkRow
          href={`/my/goal?goal=${goal}`}
          title="내 목표"
          value={GOAL_LABEL[goal]}
          action="바꾸기"
        />
        <Divider />
        <ValueLinkRow
          href="/my/body"
          title="내 몸에 맞추기"
          value={
            info.bodyKcal
              ? `${info.bodyKcal.toLocaleString("ko-KR")}kcal 기준`
              : "기본 2,000kcal"
          }
          action={info.bodyKcal ? "고치기" : "맞추기"}
        />

        <Band />
        <ListRow title="점수 기준 보기" href="/grade-guide" />
        <Divider />
        {info.account ? (
          // 【최종】 메모 「안 정함: 켜고 끄기 모양(출시 때 다시 정함)」. 지금은 꺼진 채로 두고 누르면 알림 띠만 띄운다
          <ListRow
            title="알림"
            description="분석이 끝나면 알려 드려요"
            toggle={{ checked: false, onChange: showNotifyToast }}
          />
        ) : (
          <ListRow
            title="알림"
            description="분석이 끝나면 알려 드려요"
            onClick={showNotifyToast}
          />
        )}
        <Divider />
        <ListRow title="문의하기" href={inquiryUrl} />
        <Divider />
        {/* 로그인하지 않아도 열린다 */}
        <ListRow title="이용 통계" href="/my/analytics" />
      </main>

      {toast && (
        <Toast key={toast.id} message={toast.message} action={toastAction} />
      )}
    </>
  );
}

function LoginPrompt() {
  return (
    <div className="px-5 pt-2 pb-6">
      <div className="flex flex-col gap-3.5 rounded-md bg-bg-tint p-5">
        <p className="text-body1-medium text-text-strong">
          로그인하면 폰을 바꿔도
          <br />
          기록이 남아요
        </p>
        <Button asChild kind="secondary" size="M" className="w-full">
          <Link href="/login">카카오, 네이버, 구글로 로그인</Link>
        </Button>
      </div>
    </div>
  );
}

function AccountRow({ account }: { account: MyAccount }) {
  return (
    // 닉네임은 글자 모양으로 찾을 수 없어 화면 기록(PostHog)에서 통째로 가린다(lib/analytics/posthog.ts)
    <div className="ph-mask ph-sensitive flex items-center gap-3.5 px-5 pt-2 pb-6">
      <span
        aria-hidden
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-bg-tint text-title2 text-text-body"
      >
        {/* 이모지로 시작하는 닉네임도 한 글자째로 자르게 코드 포인트 단위로 센다 */}
        {Array.from(account.nickname)[0]}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-body1-medium text-text-strong">
          {account.nickname}
        </span>
        <span className="text-body2 text-text-sub">
          {PROVIDER_LABEL[account.provider]}로 연결됨
        </span>
      </span>
    </div>
  );
}

/** 왼쪽 이름 · 오른쪽 지금 값 + 작은 「바꾸기 ›」. 줄 전체가 링크다 */
function ValueLinkRow({
  href,
  title,
  value,
  action,
}: {
  href: string;
  title: string;
  value: string;
  action: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-1 bg-bg-page pr-5">
      <span className="flex min-w-0 flex-1 items-center gap-3 py-4 pr-2 pl-5">
        <span className="flex-1 text-body1 text-text-strong">{title}</span>
        <span className="shrink-0 text-body1-medium text-text-sub">
          {value}
        </span>
      </span>
      <span className="flex shrink-0 items-center text-body2-medium text-text-sub">
        {action}
        <IconChevronRight className="size-4 text-icon-sub" />
      </span>
    </Link>
  );
}
