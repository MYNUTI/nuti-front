import type { Metadata } from "next";
import Image from "next/image";

import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";

import { IntroLayout } from "../intro-layout";

export const metadata: Metadata = { title: "서비스 소개" };

// 0-4b 서비스 소개 2/2. 피그마 메모: 건너뛰기 없음, 뒤로(‹) → 0-4
export default function Page() {
  return (
    <IntroLayout
      top={<TopBar left={<BackButton fallbackHref="/intro" />} />}
      visual={
        // 피그마 「추천 카드」(11-03, 옛 그림 대신)를 PNG 3배로 내보낸 고정 그림. 같은 뜻은 제목·설명이 전한다.
        // 카드 내용이나 점수 색 모드가 바뀌면 피그마 노드 7947:16034를 다시 내보낸다
        <Image
          src="/intro/recommend-card.png"
          width={828}
          height={638}
          sizes="276px"
          alt=""
          loading="eager"
          fetchPriority="high"
          className="h-auto w-69"
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
