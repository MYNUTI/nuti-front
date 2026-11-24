import type { Metadata } from "next";
import Image from "next/image";

import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";

import { IntroLayout } from "../intro-layout";

export const metadata: Metadata = { title: "서비스 소개" };

// 0-4b 서비스 소개 2/2. 디자인 메모: 건너뛰기 없음, 뒤로(‹) → 0-4
export default function Page() {
  return (
    <IntroLayout
      top={<TopBar left={<BackButton fallbackHref="/intro" />} />}
      visual={
        // 【최종】 그림(캐릭터 × 프로틴바, 목표별 점수 + 연한 라임 면)을 한 장으로 합쳐 3배로 만든 PNG(노드 9306:8252 · 8253).
        // 같은 뜻은 제목이 전한다
        <Image
          src="/intro/by-goal.png"
          width={918}
          height={792}
          sizes="306px"
          alt=""
          loading="eager"
          fetchPriority="high"
          // 디자인 402px 화면에서 306px. 좁은 화면에서는 같은 비율로 줄인다
          className="h-auto w-[76.1vw] max-w-[306px]"
        />
      }
      title={
        <>
          같은 제품도
          <br />
          목표에 따라 점수가 달라요
        </>
      }
      step={1}
      ctaLabel="목표 고르기"
      ctaHref="/intro/goal"
    />
  );
}
