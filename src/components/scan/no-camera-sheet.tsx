"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/common/button";
import { BottomSheet } from "@/components/common/sheet";
import {
  detectCameraPlace,
  type CameraPlace,
} from "@/components/scan/camera-place";
import {
  useImageBarcode,
  type ImageMiss,
} from "@/components/scan/scan-image-input";
import { MISS_MESSAGE } from "@/components/scan/scan-stage";

/**
 * 3-1 스캔(카메라를 못 여는 곳). 카카오톡 같은 앱 안 브라우저나 PC에서 스캔을 누르면 2-1 홈 위에 뜬다.
 * 디자인 메모: 다른 브라우저로 열기 → 바깥 브라우저의 0-3 · 바코드 사진 올리기 → 3-2 · ✕ → 2-1 홈
 * 사진·번호로 찾으면 카메라 없이 쓰는 스캔 화면(/scan?gtin= · ?manual=1)에서 결과를 보인다.
 */
// PC 시트에는 「바코드 번호 입력」이 없어 「직접 입력」 대신 「이름으로 찾기」를 권한다
const PC_MISS_MESSAGE: Record<ImageMiss, string> = {
  ...MISS_MESSAGE,
  "not-found":
    "사진에서 바코드를 찾지 못했어요. 다른 사진을 고르거나 이름으로 찾아 주세요",
};

// 기기 판별은 브라우저에서만 된다. 서버 렌더에서는 null이라 시트를 그리지 않는다
let cachedPlace: CameraPlace | undefined;
const subscribe = () => () => {};
const getPlace = () => (cachedPlace ??= detectCameraPlace());
const getServerPlace = () => null;

export function NoCameraSheet({ closeHref }: { closeHref: string }) {
  const router = useRouter();
  const place = useSyncExternalStore(subscribe, getPlace, getServerPlace);
  // 주소가 바뀌기 전에 먼저 닫아야 끌어 닫을 때 시트가 제자리로 튀지 않는다
  const [open, setOpen] = useState(true);
  const [miss, setMiss] = useState<ImageMiss | null>(null);
  const photo = useImageBarcode({
    onGtin: (gtin) => router.push(`/scan?gtin=${gtin}`),
    onMiss: setMiss,
  });

  // 카메라를 열 수 있는 곳에서 이 주소로 바로 들어온 경우에는 띄울 안내가 없다
  if (!place || place.kind === "ok") return null;
  const pc = place.kind === "pc";
  const openExternal = place.kind === "in-app" ? place.openExternal : undefined;

  return (
    <BottomSheet
      open={open}
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
      <p className="text-body1 text-text-sub">
        {pc ? (
          "PC에서는 카메라로 찍을 수 없어요."
        ) : (
          <>
            {/* 바깥 브라우저로 열 방법이 없는 곳은 그 줄만 뺀다 */}
            {openExternal && (
              <>
                다른 브라우저에서 열거나,
                <br />
              </>
            )}
            바코드 사진이나 번호, 이름으로 찾을 수 있어요.
          </>
        )}
      </p>
      <div className="flex flex-col gap-2 pt-4">
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
        {photo.input}
        <Button
          type="button"
          // 디자인 메모: PC는 사진 올리기가 주 버튼. 앱 안에서도 바깥으로 열 수 없으면 주 버튼이 된다
          kind={openExternal ? "secondary" : "primary"}
          disabled={photo.reading}
          onClick={() => {
            setMiss(null);
            photo.open();
          }}
        >
          {photo.reading ? "읽는 중…" : "바코드 사진 올리기"}
        </Button>
        {!pc && (
          <Button kind="secondary" asChild>
            <Link href="/scan?manual=1">바코드 번호 입력</Link>
          </Button>
        )}
        <Button kind="secondary" asChild>
          <Link href="/search">이름으로 찾기</Link>
        </Button>
      </div>
      {/* 시트가 뒤 화면을 덮고 aria-hidden 처리하므로 사진 못 읽음 안내는 시트 안에 둔다(0-3x와 같은 방식).
            「사진에서 바코드를 못 읽었을 때」 상태를 만들면 그 모양으로 바꾼다 */}
      <p role="status" className="pt-3 text-body2 text-text-sub">
        {miss && (pc ? PC_MISS_MESSAGE[miss] : MISS_MESSAGE[miss])}
      </p>
    </BottomSheet>
  );
}
