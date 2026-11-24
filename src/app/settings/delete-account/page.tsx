import type { Metadata } from "next";
import Link from "next/link";

import { BackButton } from "@/components/common/back-button";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { TopBar } from "@/components/common/top-bar";
import { IconAlert } from "@/components/icons";

export const metadata: Metadata = { title: "계정 삭제" };

/*
 * 5-5 설정(계정 삭제, 【최종】). 5-5 설정(로그인 후)의 「계정 삭제」에서 온다. 뒤로(‹)는 5-5.
 * 「계정 삭제하기」 → 2-1 홈(계정을 삭제했을 때) + 알림 「계정을 삭제했어요」.
 * 메모 「안 정함: 「남는 것」 문장의 변호사 확인(ACCT_008)」.
 */
export default async function Page({
  searchParams,
}: PageProps<"/settings/delete-account">) {
  /*
   * 미리보기: ?state=failed — 삭제가 실패했을 때(화면은 그대로, 문장만). 탈퇴 API를 붙이면 화면 안 상태로 바꾼다
   */
  const { state } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar
        title="계정 삭제"
        left={<BackButton fallbackHref="/settings?state=login" />}
      />
      <main className="flex flex-1 flex-col">
        <h2 className="px-5 pt-2 pb-6 text-title1 text-text-strong">
          계정을 삭제할까요?
        </h2>
        <div className="px-5">
          <div className="flex flex-col gap-5 rounded-md bg-bg-tint p-5 text-body1 text-text-body">
            <section className="flex flex-col gap-1">
              <h3 className="text-body1-bold text-text-strong">지워지는 것</h3>
              <p>
                계정 정보(이메일, 닉네임)와
                <br />
                계정에 저장한 목표, 몸 정보, 기록
              </p>
            </section>
            <section className="flex flex-col gap-1">
              <h3 className="text-body1-bold text-text-strong">남는 것</h3>
              <p>
                보내 주신 분석 요청과 정보 수정 요청,
                <br />
                그리고 통계 · 연구를 위해
                <br />
                가명처리한 기록은 정해진 기간까지 남아요
              </p>
            </section>
            <p className="flex items-center gap-2 text-body2">
              <IconAlert
                aria-hidden
                className="size-[18px] shrink-0 text-icon-default"
              />
              삭제한 계정은 되돌릴 수 없어요.
            </p>
          </div>
        </div>
      </main>
      <BottomCta
        className="sticky bottom-0"
        note={
          state === "failed" ? (
            <span
              role="alert"
              className="text-body2 break-keep text-text-danger"
            >
              계정을 삭제하지 못했어요. 다시 시도해 주세요.
            </span>
          ) : undefined
        }
      >
        <Button asChild kind="danger" className="flex-1">
          {/* 탈퇴 API(`authMutations.withdraw`)는 API 연결 때 붙인다. 지금은 홈의 「계정을 삭제했을 때」로만 간다 */}
          <Link href="/home?state=deleted" replace>
            계정 삭제하기
          </Link>
        </Button>
      </BottomCta>
    </div>
  );
}
