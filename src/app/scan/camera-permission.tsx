"use client";

import Image from "next/image";
import Link from "next/link";

import { useGoBack } from "@/components/common/back-button";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconClose } from "@/components/icons";

/*
 * 0-3 카메라 권한 안내. 카메라를 아직 허용하지 않았는데 스캔에 들어오면 보인다.
 * 「카메라 허용하기」는 브라우저 권한 창을 띄우는 쪽(onAllow)에 맡긴다.
 * 【최종】 메모: ✕ · 「나중에 할게요」 → 들어온 화면(첫 실행이면 2-1 홈). 안내 문장은 띄우지 않는다.
 */
export function CameraPermission({ onAllow }: { onAllow: () => void }) {
  const goBack = useGoBack("/home");

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar
        right={
          <TopBarButton aria-label="닫기" onClick={goBack}>
            <IconClose />
          </TopBarButton>
        }
      />
      {/* 【최종】: 위 막대 아래 65(여백 25 + 40)에 그림, 그림과 제목 사이 25 */}
      <main className="flex flex-1 flex-col items-center px-5 pt-[65px] text-center">
        {/* 【최종】 메모: 그림은 임시. 0-4와 같은 캐릭터(배경 면 없이)를 3배 PNG로(노드 9306:11241) */}
        <Image
          src="/scan/camera-permission.png"
          width={918}
          height={690}
          sizes="306px"
          alt=""
          loading="eager"
          fetchPriority="high"
          // 디자인 402px 화면에서 306px. 좁은 화면에서는 같은 비율로 줄인다
          className="h-auto w-[76.1vw] max-w-[306px]"
        />
        <h1 className="mt-[25px] text-title1 text-text-strong">
          카메라로 바코드를
          <br />
          찍어 볼까요?
        </h1>
        <p className="mt-3 text-body1 text-text-sub">
          점수가 있는 제품은 바로 보여 드려요.
        </p>
        {/* 【최종】 메모: 카메라 없이 이름으로 찾기 → 2-3 검색(처음) */}
        <Link
          href="/search"
          className="mt-auto flex h-11 items-center gap-1 text-body2-medium text-brand-link"
        >
          카메라 없이 이름으로 찾기<span aria-hidden>›</span>
        </Link>
      </main>
      <BottomCta>
        <Button
          type="button"
          kind="secondary"
          className="flex-1"
          onClick={goBack}
        >
          나중에 할게요
        </Button>
        <Button type="button" kind="lime" className="flex-1" onClick={onAllow}>
          카메라 허용하기
        </Button>
      </BottomCta>
    </div>
  );
}
