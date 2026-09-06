import type { Metadata } from "next";
import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";
import { GradeBadge, GradeBar } from "@/components/common/grade";

export const metadata: Metadata = {
  title: "스캔 결과",
};

export default function OnboardingResultPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3.5">
            <span className="size-14 shrink-0 rounded-xl bg-muted" />
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold">더단백 라떼 350ml</span>
              <span className="text-[13px] text-muted-foreground">
                1회 제공량 350ml
              </span>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <GradeBadge grade="D" className="size-11 text-lg" />
            <span className="text-[15px] font-bold">잘 안 맞아요</span>
          </div>

          <GradeBar grade="D" className="mt-3" />

          <p className="mt-4 text-[15px] font-bold">
            당류가 하루 권장량의 42%예요
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            식약처 공공 영양성분DB 기준 · 노출비를 받지 않습니다
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2.5 pt-10">
          <CtaButton asChild>
            <Link href="/onboarding/goal">바로 목표 설정하기</Link>
          </CtaButton>
          <CtaButton asChild tone="secondary">
            <Link href="/onboarding/scan">하나 더 찍어보기</Link>
          </CtaButton>
        </div>
      </div>
    </main>
  );
}
