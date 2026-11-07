import Image from "next/image";
import Link from "next/link";

import { ScoreRing, type ScoreBand } from "@/components/common/score-ring";
import { cn } from "@/lib/utils";

export type ProductCardItem = {
  id: string;
  brand: string;
  name: string;
  image: string;
  /** 사진 원본 크기(정사각) */
  imageSize: number;
  score: number;
  band: ScoreBand;
  /** warn이면 분홍(걸리는 성분) */
  tags: { label: string; warn?: boolean }[];
};

/*
 * 가로로 미는 제품 사진 카드(폭 114). 2-1 홈 「편의점 인기 상품」, 3-2 「더 맞는 제품」이 같은 카드를 쓴다.
 * 사진 · 브랜드 + 점수 링 · 이름 두 줄 · 태그 두 줄.
 */
export function ProductCard({ product }: { product: ProductCardItem }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="flex w-[114px] shrink-0 flex-col gap-1.5"
    >
      <Image
        src={product.image}
        width={product.imageSize}
        height={product.imageSize}
        sizes="114px"
        alt=""
        className="size-[114px] rounded-sm border border-line-default bg-white object-contain"
      />
      <span className="flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-[12px] leading-4 text-text-sub">
          {product.brand}
        </span>
        {/* 디자인은 S(32) 링을 30으로 줄여 놓았다. 부품 크기 S를 그대로 쓴다 */}
        <ScoreRing score={product.score} band={product.band} size="S" />
      </span>
      <span className="line-clamp-2 h-9 text-[13px] leading-[18px] font-medium break-keep text-text-strong">
        {product.name}
      </span>
      <span className="flex h-11 flex-wrap content-start gap-1 overflow-hidden">
        {product.tags.map((t) => (
          <span
            key={t.label}
            className={cn(
              "rounded-[4px] px-1.5 py-0.5 text-[11px] leading-4",
              t.warn
                ? "bg-accent-pink-weak text-accent-pink-text"
                : "bg-bg-band text-text-body",
            )}
          >
            {t.label}
          </span>
        ))}
      </span>
    </Link>
  );
}
