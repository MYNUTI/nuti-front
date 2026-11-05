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
        // 디자인 「추천 카드」(11-03, 옛 그림 대신)를 PNG 3배로 내보낸 고정 그림. 같은 뜻은 제목·설명이 전한다.
        // 카드 내용이나 점수 색 모드가 바뀌면 디자인 노드 7947:16034를 다시 내보낸다
        <Image
          src="/intro/recommend-card.png"
          width={828}
          height={638}
          sizes="276px"
          alt=""
          loading="eager"
          fetchPriority="high"
          // 디자인 402px 화면에서 276px. 좁은 화면에서는 같은 비율로 줄인다
          className="h-auto w-[68.66vw] max-w-69"
        />
      }
      title={
        <>
          같은 제품도
          <br />
          목표에 따라 등급이 달라요
        </>
      }
      body="내 목표를 고르면 그 목표로 계산해요."
      step={1}
      ctaLabel="목표 고르기"
      ctaHref="/intro/goal"
    />
  );
}
