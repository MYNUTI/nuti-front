import type { Metadata } from "next";
import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";
import { IconCamera } from "@/components/icons";

export const metadata: Metadata = {
  title: "제품 찍어보기",
};

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <h1 className="text-2xl leading-snug font-bold">
          집에 있는 음식
          <br />
          하나만 찍어보세요
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          2분이면 내 목표에 맞는지 알 수 있어요.
        </p>

        <div className="mt-5 flex aspect-5/4 w-full items-center justify-center rounded-3xl bg-muted">
          <IconCamera className="size-14 text-muted-foreground" />
        </div>

        <div className="mt-auto flex flex-col gap-2.5 pt-10">
          <CtaButton asChild>
            <Link href="/onboarding/scan">찍어보기</Link>
          </CtaButton>
          <CtaButton asChild tone="outline">
            <Link href="/onboarding/pick">지금 찍을 게 없어요</Link>
          </CtaButton>
        </div>
      </div>
    </main>
  );
}
