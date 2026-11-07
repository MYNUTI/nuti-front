"use client";

import Image from "next/image";
import { useState } from "react";

import type { ProductResult } from "./_fixtures";

/*
 * 3-2 제품 머리의 큰 사진. 사진이 없거나 주소가 깨지면 3-2 「사진이 없을 때」 그림으로 바꾼다.
 * 디자인 메모: 그림은 모든 종류에 같은 것, 다른 제품 사진을 빌려 쓰지 않음, 큰 칸에만 그림 아래 「제품 사진이 아직 없어요」,
 * 화면 읽기용 대체 글 「제품 사진 없음」.
 * 깨짐 여부는 사진마다 따로라 쓰는 쪽이 key={src}로 다시 그린다.
 */
export function ProductPhoto({ image }: { image: ProductResult["image"] }) {
  const [broken, setBroken] = useState(false);

  if (image && !broken) {
    return (
      <Image
        src={image.src}
        width={image.size}
        height={image.size}
        sizes="256px"
        alt=""
        loading="eager"
        fetchPriority="high"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div className="relative">
      <Image
        src="/common/no-photo.png"
        width={256}
        height={256}
        sizes="256px"
        alt="제품 사진 없음"
        loading="eager"
        className="size-full"
      />
      {/* 대체 글이 같은 뜻을 전하니 화면 읽기에서는 뺀다 */}
      <p
        aria-hidden
        className="absolute inset-x-0 bottom-3.5 text-center text-[12px] leading-[14px] text-text-sub"
      >
        제품 사진이 아직 없어요
      </p>
    </div>
  );
}
