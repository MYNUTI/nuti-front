"use client";

import Image from "next/image";
import { useState } from "react";

import { cn, isRemoteImage } from "@/lib/utils";

/**
 * 제품 카드의 정사각 사진. 사진이 없거나 주소가 깨지면 같은 크기의 회색 칸에 「사진 없음」 그림(글자 없음,
 * 【최종】 2-4 검색 결과(사진이 없는 제품이 섞일 때)).
 */
export function ProductCardPhoto({
  src,
  size,
  fluid,
}: {
  src: string | null;
  size: number;
  fluid: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const box = cn(
    "aspect-square rounded-sm border border-line-default object-contain",
    fluid ? "w-full" : "size-[114px]",
  );
  if (!src || broken) {
    return (
      <Image
        src="/common/no-photo.png"
        width={512}
        height={512}
        sizes={fluid ? "120px" : "114px"}
        alt=""
        className={cn(box, "bg-bg-tint")}
      />
    );
  }
  return (
    <Image
      src={src}
      unoptimized={isRemoteImage(src)}
      width={size}
      height={size}
      sizes={fluid ? "120px" : "114px"}
      alt=""
      className={cn(box, "bg-white")}
      onError={() => setBroken(true)}
    />
  );
}
