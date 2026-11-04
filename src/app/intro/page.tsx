import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/common/button";

import { IntroLayout } from "./intro-layout";

export const metadata: Metadata = { title: "서비스 소개" };

// 0-4 서비스 소개 1/2
export default function Page() {
  return (
    <IntroLayout
      top={
        <div className="flex h-13 items-center justify-end pr-2">
          <Button kind="text" size="S" asChild>
            <Link href="/intro/goal">건너뛰기</Link>
          </Button>
        </div>
      }
      visual={
        // 피그마 메모: 임시 그림(AI 생성, 10-30). 정식 그림이 오면 public/intro/scan.png를 바꾼다
        <Image
          src="/intro/scan.png"
          width={1024}
          height={1024}
          sizes="260px"
          alt=""
          loading="eager"
          fetchPriority="high"
          className="size-65"
        />
      }
      title={
        <>
          바코드를 찍으면
          <br />
          나에게 맞는 등급이 나와요
        </>
      }
      body={
        <>
          편의점, 마트 가공식품의 영양성분을
          <br />
          100점 만점 점수로 보여 드려요.
          <br />
          점수에 광고비가 반영되지 않아요.
        </>
      }
      step={0}
      ctaLabel="다음"
      ctaHref="/intro/2"
    />
  );
}
