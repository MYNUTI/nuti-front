"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { BottomSheet } from "@/components/common/sheet";
import { useImageBarcode } from "@/components/scan/scan-image-input";
import { PhotoMissSheet } from "@/components/scan/scan-miss-sheet";
import { useCameraPlace } from "@/components/scan/use-camera-place";
import { cn } from "@/lib/utils";

/**
 * 3-1 스캔(카메라를 못 여는 곳). 카카오톡 같은 앱 안 브라우저나 PC에서 스캔을 누르면 2-1 홈 위에 뜬다.
 * 디자인 메모: 다른 브라우저로 열기 → 바깥 브라우저의 0-3 · 바코드 사진 올리기 → 3-2 · ✕ → 2-1 홈
 * 사진·번호로 찾으면 카메라 없이 쓰는 스캔 화면(/scan?gtin= · ?manual=1)에서 결과를 보인다.
 */

export function NoCameraSheet({ closeHref }: { closeHref: string }) {
  const router = useRouter();
  const place = useCameraPlace();
  // 주소가 바뀌기 전에 먼저 닫아야 끌어 닫을 때 시트가 제자리로 튀지 않는다
  const [open, setOpen] = useState(true);
  // 사진을 못 읽으면 시트 위에 시트를 띄우지 않고 이 시트를 「사진에서 바코드를 못 읽었어요」로 바꾼다
  const [miss, setMiss] = useState(false);
  const photo = useImageBarcode({
    onGtin: (gtin) => router.push(`/scan?gtin=${gtin}`),
    onMiss: () => setMiss(true),
  });

  // 카메라를 열 수 있는 곳에서 이 주소로 바로 들어온 경우에는 띄울 안내가 없다
  if (!place || place.kind === "ok") return null;
  const pc = place.kind === "pc";
  const openExternal = place.kind === "in-app" ? place.openExternal : undefined;

  return (
    <>
      {/* 두 시트가 번갈아 닫히며 내용이 빠지므로 「다른 사진 고르기」가 쓸 input은 시트 바깥에 둔다 */}
      {photo.input}
      <PhotoMissSheet
        open={open && miss}
        // ✕로 닫으면 처음 안내로 돌아간다
        onOpenChange={(next) => setMiss(next)}
        onManual={pc ? undefined : () => router.push("/scan?manual=1")}
        onPickAgain={() => {
          setMiss(false);
          photo.open();
        }}
      />
      <BottomSheet
        open={open && !miss}
        onOpenChange={(next) => {
          if (next) return;
          setOpen(false);
          router.replace(closeHref, { scroll: false });
        }}
        title={
          pc ? (
            "휴대폰으로 찍거나 바코드 사진을 올려 주세요"
          ) : (
            <>
              {place.app} 안에서는
              <br />
              카메라가 열리지 않아요
            </>
          )
        }
      >
        {/* 【최종】: 앱 안 브라우저 시트는 본문 없이 제목 다음 바로 버튼 */}
        {pc && (
          <p className="text-body1 text-text-sub">
            PC에서는 카메라로 찍을 수 없어요.
          </p>
        )}
        <div className={cn("flex flex-col gap-2", pc && "pt-4")}>
          {openExternal && (
            <Button
              type="button"
              onClick={() => {
                window.location.href = openExternal(
                  `${window.location.origin}/scan`,
                );
              }}
            >
              다른 브라우저로 열기
            </Button>
          )}
          {/* 【최종】 메모: 다른 브라우저 → 바코드 번호 입력 → 바코드 사진 올리기 → 이름으로 찾기 */}
          {!pc && (
            <Button kind="secondary" asChild>
              <Link href="/scan?manual=1">바코드 번호 입력</Link>
            </Button>
          )}
          <Button
            type="button"
            // 디자인 메모: PC는 사진 올리기가 주 버튼. 앱 안에서도 바깥으로 열 수 없으면 주 버튼이 된다
            kind={openExternal ? "secondary" : "primary"}
            disabled={photo.reading}
            onClick={photo.open}
          >
            {photo.reading ? "읽는 중…" : "바코드 사진 올리기"}
          </Button>
          <Button kind="secondary" asChild>
            <Link href="/search">이름으로 찾기</Link>
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
