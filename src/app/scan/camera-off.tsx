"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { CameraOffGuide } from "@/components/common/camera-off-guide";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconClose } from "@/components/icons";
import { useImageBarcode } from "@/components/scan/scan-image-input";
import { PhotoMissSheet } from "@/components/scan/scan-miss-sheet";
import type { Gtin } from "@/lib/scan/types";

/*
 * 0-3x 카메라가 꺼져 있을 때. 카메라 권한을 거부했거나 거부한 채로 스캔에 들어오면 보인다.
 * 위 안내(브라우저 칩 · 단계 · 다시 켜기 · 아직 꺼져 있음)는 3-7과 같이 쓰는 `CameraOffGuide`.
 */
export function CameraOff({
  stillOff,
  onRetry,
  onPhotoGtin,
  onManual,
}: {
  /** 「카메라 다시 켜기」를 눌렀는데 아직 꺼져 있다(【최종】 0-3x 아직 꺼져 있음) */
  stillOff: boolean;
  /** 카메라 다시 켜기. 켰으면 3-1, 아직 꺼져 있으면 그대로 */
  onRetry: () => void;
  /** 사진에서 읽은 바코드로 3-2 결과를 연다 */
  onPhotoGtin: (gtin: Gtin) => void;
  onManual: () => void;
}) {
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
        <CameraOffGuide
          retryKind="lime"
          stillOff={stillOff}
          onRetry={onRetry}
        />
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
