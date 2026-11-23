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
      <main className="flex flex-1 flex-col items-center px-5 pt-10 text-center">
        {/* 디자인 메모: 임시 그림(AI 생성, 10-30). 정식 그림이 오면 public/scan/camera-permission.png를 바꾼다 */}
        <Image
          src="/scan/camera-permission.png"
          width={1024}
          height={1024}
          sizes="230px"
          alt=""
          loading="eager"
          fetchPriority="high"
          // 디자인 402px 화면에서 230px. 좁은 화면에서는 같은 비율로 줄인다
          className="aspect-square h-auto w-[57.2vw] max-w-[230px]"
        />
        <h1 className="mt-9 text-title1 text-text-strong">
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
          className="mt-auto flex h-11 items-center text-body2-medium text-brand-link"
        >
          카메라 없이 이름으로 찾기 <span aria-hidden>›</span>
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
