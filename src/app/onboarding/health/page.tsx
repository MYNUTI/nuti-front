import type { Metadata } from "next";
import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";

export const metadata: Metadata = {
  title: "건강정보 동의",
};

export default function HealthConsentPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <h1 className="text-2xl leading-snug font-bold">
          건강 목표를 저장할까요?
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          목표에 맞춰 등급을 다시 계산해 드려요.
        </p>

        <div className="mt-7 flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
          <span className="text-[15px] font-bold">[선택] 건강 목표 · 체중</span>
          <span className="text-[13px] text-muted-foreground">
            법에서 따로 다루는 정보라 위 동의와 분리해서 받아요.
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-2.5 pt-10">
          <CtaButton asChild>
            <Link href="/onboarding/camera">동의하고 목표 설정하기</Link>
          </CtaButton>
          <CtaButton asChild tone="secondary">
            <Link href="/onboarding/camera">일반 기준으로 볼게요</Link>
          </CtaButton>
        </div>
      </div>
    </main>
  );
}
