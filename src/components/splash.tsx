import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";

export function Splash() {
  return (
    <div className="flex flex-1 flex-col px-5 pb-6">
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-[34px] font-bold">마이뉴티</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          찍으면 나오는,
          <br />내 목표 기준 영양 등급
        </p>
      </div>

      <CtaButton asChild tone="neutral">
        <Link href="/onboarding/consent">시작하기</Link>
      </CtaButton>
    </div>
  );
}
