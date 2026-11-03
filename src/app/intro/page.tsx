import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { StepDots } from "@/components/common/step-dots";

export const metadata: Metadata = { title: "서비스 소개" };

// 0-4 서비스 소개 1/2
export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <div className="flex h-13 items-center justify-end pr-2">
        <Button kind="text" size="S" asChild>
          <Link href="/intro/goal">건너뛰기</Link>
        </Button>
      </div>
      <main className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        {/* 피그마 메모: 임시 그림(AI 생성, 10-30). 정식 그림이 오면 public/intro/scan.png를 바꾼다 */}
        <Image
          src="/intro/scan.png"
          width={1024}
          height={1024}
          sizes="260px"
          alt=""
          fetchPriority="high"
          className="size-65"
        />
        <h1 className="mt-10 text-title1 text-text-strong">
          바코드를 찍으면
          <br />
          나에게 맞는 등급이 나와요
        </h1>
        <p className="mt-3 text-body1 text-text-sub">
          편의점, 마트 가공식품의 영양성분을
          <br />
          100점 만점 점수로 보여 드려요.
          <br />
          점수에 광고비가 반영되지 않아요.
        </p>
        <StepDots count={2} current={0} className="mt-7" />
      </main>
      <BottomCta>
        <Button className="flex-1" asChild>
          <Link href="/intro/2">다음</Link>
        </Button>
      </BottomCta>
    </div>
  );
}
