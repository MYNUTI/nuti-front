import Link from "next/link";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { StepDots } from "@/components/common/step-dots";

/* 0-4·0-4b 서비스 소개의 공통 배치 — 위 막대, 가운데 그림·제목·설명·단계 점, 아래 고정 버튼 */
export function IntroLayout({
  top,
  visual,
  title,
  body,
  step,
  ctaLabel,
  ctaHref,
}: {
  top: React.ReactNode;
  visual: React.ReactNode;
  title: React.ReactNode;
  /** 없으면(0-4b) 제목과 단계 점 사이를 디자인대로 46으로 둔다 */
  body?: React.ReactNode;
  /** 0부터 센다 */
  step: number;
  ctaLabel: React.ReactNode;
  ctaHref: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      {top}
      <main className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        {visual}
        <h1 className="mt-10 text-title1 text-text-strong">{title}</h1>
        {body && <p className="mt-3 text-body1 text-text-sub">{body}</p>}
        <StepDots
          count={2}
          current={step}
          className={body ? "mt-7" : "mt-11.5"}
        />
      </main>
      <BottomCta>
        <Button className="flex-1" asChild>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </BottomCta>
    </div>
  );
}
