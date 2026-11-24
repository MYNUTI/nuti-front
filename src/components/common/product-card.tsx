import Link from "next/link";

import { ProductCardPhoto } from "@/components/common/product-card-photo";
import { ScoreRing, type ScoreBand } from "@/components/common/score-ring";
import { cn } from "@/lib/utils";

export type ProductCardItem = {
  id: string;
  brand: string;
  name: string;
  /** 없으면 「사진 없음」 그림(2-4 사진이 없는 제품이 섞일 때) */
  image: string | null;
  /** 사진 원본 크기(정사각) */
  imageSize: number;
  score: number;
  band: ScoreBand;
  /** warn이면 분홍(걸리는 성분) */
  tags: { label: string; warn?: boolean }[];
};

/** 카드가 받는 값. 점수가 없는 제품(분석 전)은 점수 · 구간이 null — 점수 링 대신 회색 「점수 없음」 알약, 태그 없음(2-4) */
export type ProductCardInput = Omit<ProductCardItem, "score" | "band"> & {
  score: number | null;
  band: ScoreBand | null;
};

/*
 * 제품 사진 카드. 2-1 홈 「편의점 인기 상품」, 3-2 「더 맞는 제품」은 가로로 미는 줄(폭 114),
 * 3-4 더 맞는 제품(전체)는 3열 격자(fluid — 칸 폭을 채운다)로 같은 카드를 쓴다.
 * 사진 · 브랜드 + 점수 링 · 이름 두 줄 · 태그 두 줄. 이름 · 태그 칸은 높이를 고정해 카드 높이가 같다.
 * 【최종】 2-4 메모: 이름이 브랜드와 같은 말로 시작하면 이름에서 뺀다. 긴 브랜드는 말줄임.
 */
export function ProductCard({
  product,
  fluid = false,
  href = `/product/${product.id}`,
}: {
  product: ProductCardInput;
  /** 격자 칸 폭을 채운다. 기본은 가로로 미는 줄의 폭 114 */
  fluid?: boolean;
  /** 기본은 3-2 제품 결과 */
  href?: string;
}) {
  const name =
    product.brand && product.name.startsWith(`${product.brand} `)
      ? product.name.slice(product.brand.length).trim() || product.name
      : product.name;
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 flex-col gap-1.5",
        fluid ? "min-w-0" : "w-[114px]",
      )}
    >
      <ProductCardPhoto
        key={product.image}
        src={product.image}
        size={product.imageSize}
        fluid={fluid}
      />
      <span className="flex h-8 items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-[12px] leading-4 text-text-sub">
          {product.brand}
        </span>
        {product.score !== null && product.band !== null ? (
          // 디자인은 S(32) 링을 30으로 줄여 놓았다. 부품 크기 S를 그대로 쓴다
          <ScoreRing score={product.score} band={product.band} size="S" />
        ) : (
          <span className="shrink-0 rounded-[4px] bg-bg-band px-1.5 py-0.5 text-[11px] leading-4 font-bold text-text-sub">
            점수 없음
          </span>
        )}
      </span>
      <span className="line-clamp-2 h-9 text-[13px] leading-[18px] font-medium break-keep text-text-strong">
        {name}
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
