"use client";

import { useRef, useState } from "react";
import { CtaButton } from "@/components/common/cta-button";
import { toGtin14 } from "@/lib/scan/gtin";
import type { Gtin } from "@/lib/scan/types";
import { getPhotoDetector } from "@/lib/scan/wasm";

/** 이미지에서 GTIN을 얻지 못한 이유. 문구는 호출자가 정한다. */
export type ImageMiss = "not-found" | "unreadable";

async function decodeImage(file: File): Promise<string | null> {
  const detector = await getPhotoDetector();
  const bitmap = await createImageBitmap(file);
  try {
    const [barcode] = await detector.detect(bitmap);
    return barcode?.rawValue ?? null;
  } finally {
    bitmap.close();
  }
}

/**
 * 고른 이미지에서 바코드를 한 번 읽는다. 버튼 모양은 쓰는 쪽이 정하도록 숨긴 input과 여는 함수만 준다.
 *
 * `capture`를 붙이지 않는다 — 붙이면 카메라 앱이 바로 열려 앨범을 고를 수 없다. 없으면
 * 시스템 선택기가 "사진 찍기"와 "라이브러리에서 선택"을 모두 제공한다.
 *
 * 정지 이미지는 카메라 앱이 초점을 맞춰 저장한 결과라 한 장으로 확정한다. 연속 프레임
 * 확정은 라이브 스트림에만 필요하다.
 *
 * 못 찾아도 다른 입력 방법으로 넘기지 않는다. 다시 고르면 해결되는 경우가 많으므로
 * 결과만 알린다.
 */
export function useImageBarcode({
  onGtin,
  onMiss,
}: {
  onGtin: (gtin: Gtin) => void;
  onMiss: (reason: ImageMiss) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  const handleFile = async (file: File) => {
    setReading(true);
    let raw: string | null;
    try {
      raw = await decodeImage(file);
    } catch {
      // WASM 로드 실패, 브라우저가 디코딩 못 하는 이미지 형식 등
      onMiss("unreadable");
      return;
    } finally {
      setReading(false);
    }

    // 디코드 중에 카메라가 다른 바코드를 확정했더라도 사진 결과가 이긴다. 사진 선택은
    // 사용자가 방금 한 명시적 행동이고, 선택기에서 돌아온 직후 카메라에 우연히 잡힌 값보다
    // 의도에 가깝다.
    if (raw) onGtin(toGtin14(raw));
    else onMiss("not-found");
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(event) => {
        const file = event.target.files?.[0];
        // 같은 파일을 다시 골라도 change가 발생하도록 비운다.
        event.target.value = "";
        if (file) void handleFile(file);
      }}
    />
  );

  return { input, open: () => inputRef.current?.click(), reading };
}

/** 임시 스캔 화면용 버튼. 3-1을 v3로 다시 만들면 useImageBarcode만 남긴다 */
export function ScanImageInput({
  onGtin,
  onMiss,
  disabled,
  className,
  children,
}: {
  onGtin: (gtin: Gtin) => void;
  onMiss: (reason: ImageMiss) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { input, open, reading } = useImageBarcode({ onGtin, onMiss });

  return (
    <>
      {input}
      <CtaButton
        type="button"
        tone="secondary"
        className={className}
        disabled={disabled || reading}
        onClick={open}
      >
        {reading ? "읽는 중…" : children}
      </CtaButton>
    </>
  );
}
