"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { cn } from "@/lib/utils";

import type { CompareItem } from "./compare-store";

/*
 * 비교함 바(하단 고정). 담은 제품 사진 · 「비교함 N」 · 비교하기. 3-2 제품 결과(아래 고정 줄 바로 위)와
 * 3-4 더 맞는 제품(화면 맨 아래)이 같이 쓴다. 자리(bottom·아래 여백)는 쓰는 쪽이 className으로 정한다.
 * 바 높이 = 위 선 1 + 위 여백 12 + 버튼 44 + 아래 여백(쓰는 쪽이 정함) = 57 + 아래 여백. 아래 여백 칸·알림 띠 위치도 이 식으로 맞춘다.
 * 디자인 메모: 1개만 담고 비교하기 → 「비교하려면 하나 더 담아 주세요」(버튼을 회색으로 막지 않음). 알림은 쓰는 쪽이 띄운다.
 * 【최종】: 1개면 「1개 담음, 하나 더 담으면 비교해요」, 2개부터 「비교함 N」.
 */
export function CompareBar({
  items,
  onTooFew,
  className,
}: {
  items: readonly CompareItem[];
  onTooFew: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed-app z-30 flex items-center gap-2 border-t border-line-default bg-bg-page px-5 pt-3",
        className,
      )}
    >
      {items.map((item) => (
        <span
          key={item.id}
          className="size-8 shrink-0 overflow-hidden rounded-sm bg-bg-tint"
        >
          <CompareThumb key={item.image} src={item.image} />
        </span>
      ))}
      {/* 사진 4장이면 좁은 화면(320 이하)에서 글자가 줄바꿈돼 바 높이가 깨지지 않게 한 줄로 줄인다.
          1개일 때 문구(【최종】 16 Bold, 402 기준)는 390 미만 폭에서 잘려 그 폭에서만 14로 줄인다(정한 값) */}
      <p
        className={cn(
          "min-w-0 flex-1 truncate text-body1-bold text-text-strong",
          items.length < 2 && "max-[389px]:text-body2-bold",
        )}
      >
        {items.length < 2
          ? `${items.length}개 담음, 하나 더 담으면 비교해요`
          : `비교함 ${items.length}`}
      </p>
      {items.length < 2 ? (
        <Button type="button" size="M" onClick={onTooFew}>
          비교하기
        </Button>
      ) : (
        <Button size="M" asChild>
          <Link href="/compare">비교하기</Link>
        </Button>
      )}
    </div>
  );
}

/** 비교함 바의 작은 사진. 사진이 없거나 깨지면 3-2 「사진이 없을 때」 그림만(작은 칸은 글 없이) */
function CompareThumb({ src }: { src: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    // 로컬 그림이라 작은 칸 크기로 줄여 받는다
    return (
      <Image
        src="/common/no-photo.png"
        width={32}
        height={32}
        alt=""
        className="size-full"
      />
    );
  }
  return (
    // 서버 사진 주소라 next/image 허용 도메인을 정하기 전까지 img로 둔다
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="size-full object-contain"
      onError={() => setBroken(true)}
    />
  );
}
