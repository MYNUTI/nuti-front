"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { Chip } from "@/components/common/chip";
import { StepList } from "@/components/common/step-list";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconClose } from "@/components/icons";
import { useImageBarcode } from "@/components/scan/scan-image-input";
import { PhotoMissSheet } from "@/components/scan/scan-miss-sheet";
import type { Gtin } from "@/lib/scan/types";

type Browser = "chrome" | "safari" | "samsung";

const BROWSER_LABEL: Record<Browser, string> = {
  chrome: "크롬",
  safari: "사파리",
  samsung: "삼성 인터넷",
};

// 크롬은 화면, 사파리·삼성 인터넷은 ⑩ 상태표 0-3x 줄의 문장 그대로. 메뉴 이름은 디자인 메모 「안 정함」(ONB_007)
const STEPS: Record<Browser, readonly React.ReactNode[]> = {
  chrome: [
    "주소창 왼쪽의 아이콘을 눌러요",
    "권한에서 카메라를 허용으로 바꿔요",
    <>
      이 화면으로 돌아와
      <br />
      아래 카메라 다시 켜기를 눌러요
    </>,
  ],
  safari: [
    "주소창의 '가가' 버튼을 눌러요",
    "'웹 사이트 설정'에서 카메라를 '허용'으로 바꿔요",
    "이 화면으로 돌아와 아래 '카메라 다시 켜기'를 눌러요",
  ],
  samsung: [
    "주소창의 자물쇠 아이콘을 눌러요",
    "'권한'에서 카메라를 허용해요",
    "이 화면으로 돌아와 아래 '카메라 다시 켜기'를 눌러요",
  ],
};

/*
 * 0-3x 카메라가 꺼져 있을 때. 카메라 권한을 거부했거나 거부한 채로 스캔에 들어오면 보인다.
 * 고른 브라우저 칩에 따라 단계 문장만 바뀐다.
 */
export function CameraOff({
  onRetry,
  onPhotoGtin,
  onManual,
}: {
  /** 카메라 다시 켜기. 켰으면 3-1, 아직 꺼져 있으면 그대로 */
  onRetry: () => void;
  /** 사진에서 읽은 바코드로 3-2 결과를 연다 */
  onPhotoGtin: (gtin: Gtin) => void;
  onManual: () => void;
}) {
  const [browser, setBrowser] = useState<Browser>("chrome");
  const [missOpen, setMissOpen] = useState(false);
  const photo = useImageBarcode({
    onGtin: onPhotoGtin,
    onMiss: () => setMissOpen(true),
  });

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-[max(var(--safe-bottom),12px)]">
      {/* 디자인 메모: ✕ → 2-1 홈 */}
      <TopBar
        right={
          <TopBarButton asChild aria-label="닫기">
            <Link href="/home">
              <IconClose />
            </Link>
          </TopBarButton>
        }
      />
      <main>
        <div className="flex flex-col gap-2 px-5 pt-2 pb-6">
          <h1 className="text-title1 text-text-strong">카메라가 꺼져 있어요</h1>
          <p className="text-body1 text-text-sub">
            브라우저 설정에서 카메라를 켜면
            <br />
            바로 찍을 수 있어요.
          </p>
        </div>
        <div
          role="group"
          aria-label="사용하는 브라우저"
          className="flex gap-2 px-5 pb-2"
        >
          {(Object.keys(BROWSER_LABEL) as Browser[]).map((b) => (
            <Chip
              key={b}
              selected={browser === b}
              onClick={() => setBrowser(b)}
            >
              {BROWSER_LABEL[b]}
            </Chip>
          ))}
        </div>
        <div className="pt-2 pb-6">
          <StepList steps={STEPS[browser]} />
        </div>
        <div className="px-5 pt-1 pb-5">
          <Button type="button" className="w-full" onClick={onRetry}>
            카메라 다시 켜기
          </Button>
        </div>
        <div aria-hidden className="h-2 bg-bg-band" />
        <section className="flex flex-col gap-3 px-5 py-6">
          <h2 className="text-body1-bold text-text-strong">카메라 없이 찾기</h2>
          <Button type="button" kind="secondary" onClick={onManual}>
            바코드 번호 입력
          </Button>
          {photo.input}
          <Button
            type="button"
            kind="secondary"
            disabled={photo.reading}
            onClick={photo.open}
          >
            {photo.reading ? "읽는 중…" : "바코드 사진 올리기"}
          </Button>
          <Button kind="secondary" asChild>
            <Link href="/search">이름으로 찾기</Link>
          </Button>
          <p className="text-body2 text-text-sub">
            사진은 바코드 숫자를 읽는 데만 써요.
          </p>
        </section>
      </main>
      <PhotoMissSheet
        open={missOpen}
        onOpenChange={setMissOpen}
        onManual={() => {
          setMissOpen(false);
          onManual();
        }}
        onPickAgain={() => {
          setMissOpen(false);
          photo.open();
        }}
      />
    </div>
  );
}
