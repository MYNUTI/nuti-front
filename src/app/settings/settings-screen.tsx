"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BackButton } from "@/components/common/back-button";
import { ListRow } from "@/components/common/list-row";
import { ConfirmSheet } from "@/components/common/sheet";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";

function Band() {
  return <div aria-hidden className="h-2 bg-bg-band" />;
}

function Divider() {
  return <div aria-hidden className="mx-5 h-px bg-line-default" />;
}

/** 구역 머리. 첫 구역(개인정보)만 위 16 · 아래 4, 나머지는 위 12(【최종】) */
function SectionTitle({
  first = false,
  children,
}: {
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={
        first
          ? "px-5 pt-4 pb-1 text-body1-bold text-text-strong"
          : "px-5 pt-3 text-body1-bold text-text-strong"
      }
    >
      {children}
    </h2>
  );
}

export function SettingsScreen({
  loggedIn,
  version,
}: {
  loggedIn: boolean;
  version: string;
}) {
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-safe">
      <TopBar
        title="설정"
        left={<BackButton fallbackHref="/my" />}
        right={
          <TopBarButton asChild aria-label="검색">
            <Link href="/search">
              <IconSearch />
            </Link>
          </TopBarButton>
        }
      />
      <main className="flex flex-col">
        <section className="pb-2">
          <SectionTitle first>개인정보</SectionTitle>
          <ListRow
            title="동의 관리"
            description={
              loggedIn
                ? "목표와 몸 정보 저장, 광고성 정보 수신"
                : // 로그인 전에는 받은 동의가 없고 몸 정보는 이 기기에만 저장한다(【최종】 메모)
                  "로그인하면 동의를 바꿀 수 있어요"
            }
            href="/settings/consent"
          />
          {!loggedIn && (
            <>
              <Divider />
              {/* 5-10b는 설정 위에 뜨는 시트다. 시트는 5-10b 작업 때 이 주소 값으로 띄운다 */}
              <ListRow
                title="이 기기 기록 지우기"
                href="/settings?sheet=device-delete"
              />
            </>
          )}
        </section>

        <Band />
        <section>
          <SectionTitle>약관과 처리방침</SectionTitle>
          <ListRow title="이용약관" href="/terms" />
          <Divider />
          <ListRow title="개인정보 처리방침" href="/privacy" />
        </section>

        <Band />
        <section>
          <SectionTitle>앱 정보</SectionTitle>
          <ListRow title="버전" value={version} />
        </section>

        {loggedIn && (
          <>
            <Band />
            <section>
              <SectionTitle>계정</SectionTitle>
              <ListRow title="로그아웃" onClick={() => setLogoutOpen(true)} />
              <Divider />
              <ListRow title="계정 삭제" href="/settings/delete-account" />
            </section>
          </>
        )}
      </main>

      <ConfirmSheet
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        dismissible
        danger
        title="로그아웃할까요?"
        description={
          "기록은 계정에 남아 다시 로그인하면 볼 수 있어요.\n이 기기의 몸 정보와 비교함은 지워져요."
        }
        cancelLabel="그대로 두기"
        confirmLabel="로그아웃"
        // 로그아웃 API(`useLogout`)와 이 기기 몸 정보 · 비교함 지우기는 API 연결 때 붙인다. 지금은 5-1로만 간다
        // replace: 뒤로 가기로 로그인 후 설정에 돌아오지 않게 한다(계정 삭제와 같음)
        onConfirm={() => router.replace("/my")}
      />
    </div>
  );
}
