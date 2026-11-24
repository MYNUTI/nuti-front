import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/common/button";

import { InAppBrowserSheet } from "./in-app-sheet";
import { IntroLayout } from "./intro-layout";

export const metadata: Metadata = { title: "서비스 소개" };

// 0-4 서비스 소개 1/2
export default function Page() {
  return (
    <>
      <IntroLayout
        top={
          <div className="flex h-13 items-center justify-end pr-2">
            <Button kind="text" size="S" asChild>
              <Link href="/intro/goal">건너뛰기</Link>
            </Button>
          </div>
        }
        visual={
          // 【최종】 그림(캐릭터 + 연한 라임 면)을 한 장으로 합쳐 3배로 만든 PNG(노드 9306:8238 · 8239)
          <Image
            src="/intro/scan.png"
            width={918}
            height={690}
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
            바코드를 찍으면
            <br />
            나에게 맞는 점수가 나와요
          </>
        }
        body={
          <>
            편의점, 마트 가공식품의 영양성분을
            <br />
            100점 만점 점수로 보여 드려요.
          </>
        }
        step={0}
        ctaLabel="다음"
        ctaHref="/intro/by-goal"
      />
      <InAppBrowserSheet />
    </>
  );
}
