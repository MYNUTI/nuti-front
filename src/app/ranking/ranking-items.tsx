"use client";

import Link from "next/link";
import { useState } from "react";

import { ScoreRing } from "@/components/common/score-ring";
import { cn } from "@/lib/utils";

import type { RankedProduct } from "./model";

/*
 * 2-2 점수 순위의 제품 줄 · 카드. `review/v3-rankings`의 `ranking-items.tsx`를 옮겼다.
 */

/*
 * 순위 화면의 제품 사진. API 연결 뒤에는 서버가 주는 바깥 주소라(어느 도메인인지 정해지지 않음) next/image 대신 img를 쓴다.
 * 사진이 없거나 주소가 깨지면 3-2와 같은 「사진 없음」 그림으로 바꾼다(회색 면 위에 가득).
 * 깨짐 여부는 사진마다 따로라 쓰는 쪽이 key={src}로 다시 그린다.
 */
function Photo({ src, className }: { src: string | null; className?: string }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 작은 고정 그림이고 위 사진과 같은 자리라 img로 맞춘다
      <img
        src="/common/no-photo.png"
        alt=""
        className={cn("bg-bg-band object-cover", className)}
      />
    );

  return (
    // eslint-disable-next-line @next/next/no-img-element -- API 연결 뒤 서버가 주는 바깥 주소
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn("object-contain", className)}
    />
  );
}

function Score({
  product,
  className,
}: {
  product: RankedProduct;
  className?: string;
}) {
  if (!product.score) return null;
  return (
    <ScoreRing
      score={product.score.value}
      band={product.score.band}
      size="S"
      className={className}
    />
  );
}

/*
 * 2열 사진 카드. 사진 칸(정사각 · 안쪽 5px에 원본 비율) 왼쪽 위에 순위 숫자(검은 동그라미 20),
 * 브랜드 + 점수 링, 이름 두 줄, 태그. 영양소로 정렬했을 때는 태그 자리에 그 값 한 줄만 보인다.
 */
export function RankCard({ product }: { product: RankedProduct }) {
  const photo = !!product.imageUrl;

  return (
    <Link
      href={`/product/${encodeURIComponent(product.id)}`}
      className="flex flex-col gap-1.5"
    >
      <span
        className={cn(
          "relative block aspect-square overflow-hidden rounded-sm",
          // 사진이 없을 때 그림은 테두리 없이 칸을 가득 채운다(피그마 「사진 없음(그림)」)
          photo && "border border-line-default bg-white",
        )}
      >
        <Photo
          key={product.imageUrl}
          src={product.imageUrl}
          className={
            photo
              ? "absolute inset-[5px] size-[calc(100%-10px)] rounded-[4px]"
              : "absolute inset-0 size-full"
          }
        />
        <span
          className={cn(
            "absolute flex size-5 items-center justify-center rounded-full bg-bg-dark text-[11px] leading-[14px] font-bold text-white",
            // 테두리(1px)가 있는 칸과 없는 칸 모두 칸 바깥에서 6px
            photo ? "top-[5px] left-[5px]" : "top-1.5 left-1.5",
          )}
        >
          <span className="sr-only">순위 </span>
          {product.rank}
        </span>
      </span>
      <span className="flex h-[30px] items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-[12px] leading-4 text-text-sub">
          {product.brand}
        </span>
        {/* 이 카드의 링은 30px이다. 공통 ScoreRing은 S(32)까지라 30/32로 줄여 그린다 */}
        <span className="flex size-[30px] shrink-0 items-center justify-center">
          <Score product={product} className="scale-[0.9375]" />
        </span>
      </span>
      <span className="line-clamp-2 h-9 text-[13px] leading-[18px] font-medium break-keep text-text-strong">
        {product.name}
      </span>
      <span className="flex min-h-5 flex-wrap content-start gap-1">
        {product.sortText ? (
          <Tag>{product.sortText}</Tag>
        ) : (
          product.tags.map((tag) => (
            <Tag key={tag.label} warn={tag.warn}>
              {tag.label}
            </Tag>
          ))
        )}
      </span>
    </Link>
  );
}

function Tag({
  warn = false,
  children,
}: {
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-[4px] px-1.5 py-0.5 text-[12px] leading-4 whitespace-nowrap",
        warn
          ? "bg-accent-pink-weak text-accent-pink-text"
          : "bg-bg-band text-text-body",
      )}
    >
      {children}
    </span>
  );
}

function RowPhoto({ src }: { src: string | null }) {
  return (
    <span className="relative block size-[52px] shrink-0 overflow-hidden rounded-sm border border-[#eef0f3] bg-bg-band">
      <Photo key={src} src={src} className="absolute inset-0 size-full" />
    </span>
  );
}

/*
 * 「대분류 전체」 묶음 안의 순위 줄: 순위 동그라미 20 · 사진 52 · 브랜드 + 이름 한 줄 · 점수 링 S.
 */
export function RankRow({ product }: { product: RankedProduct }) {
  return (
    <Link
      href={`/product/${encodeURIComponent(product.id)}`}
      className="flex items-center gap-2.5 py-1.5"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bg-dark text-[11px] leading-[14px] font-bold text-white">
        <span className="sr-only">순위 </span>
        {product.rank}
      </span>
      <RowPhoto src={product.imageUrl} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {product.brand && (
          <span className="truncate text-[12px] leading-[14px] text-text-sub">
            {product.brand}
          </span>
        )}
        <span className="truncate text-[14px] leading-[17px] font-medium text-text-strong">
          {product.name}
        </span>
      </span>
      <Score product={product} />
    </Link>
  );
}

/*
 * 「종류를 고르지 않았을 때」 묶음 안의 1위 줄: 사진 52 · 「샐러드 1위 · 브랜드」 · 이름 한 줄 · 점수 링 S.
 * 순위 숫자 동그라미는 없다(다른 종류끼리 순위를 매기지 않는다).
 */
export function TopRow({
  chipName,
  product,
}: {
  chipName: string;
  product: RankedProduct;
}) {
  return (
    <Link
      href={`/product/${encodeURIComponent(product.id)}`}
      className="flex items-center gap-2.5 py-1.5"
    >
      <RowPhoto src={product.imageUrl} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[12px] leading-[14px] text-text-sub">
          <span className="font-bold text-text-strong">{chipName} 1위</span>
          {product.brand && ` · ${product.brand}`}
        </span>
        <span className="truncate text-[14px] leading-[17px] font-medium text-text-strong">
          {product.name}
        </span>
      </span>
      <Score product={product} />
    </Link>
  );
}
