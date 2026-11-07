import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/common/back-button";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { ProductCard } from "@/components/common/product-card";
import { ProductHero } from "@/components/common/product-hero";
import { ReasonChip } from "@/components/common/reason-chip";
import { ScoreRing } from "@/components/common/score-ring";
import { SearchFieldLink } from "@/components/common/search-field";
import { SectionHeader } from "@/components/common/section-header";
import { Thumb } from "@/components/common/thumb";
import {
  IconChevronDown,
  IconChevronRight,
  IconCompare,
  IconFlag,
  IconHeart,
  IconShare,
} from "@/components/icons";

import { FIXTURE_PRODUCTS, type Goal, type NutrientRow } from "./_fixtures";

export async function generateMetadata({
  params,
}: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: FIXTURE_PRODUCTS[id]?.name ?? "제품 정보" };
}

const GOAL_LABEL: Record<Goal, string> = {
  diet: "다이어트",
  muscle: "근육 증가",
};

// 디자인 메모: 목표가 근육 증가면 「근육 증가 · 내 목표」 + 「체중 감량으로 보기」
const OTHER_GOAL_LABEL: Record<Goal, string> = {
  diet: "근육 증가로 보기",
  muscle: "체중 감량으로 보기",
};

function Band() {
  return <div aria-hidden className="h-2 bg-bg-band" />;
}

/*
 * 3-2 제품 결과. 위에서부터 제품 머리 · 점수 · 이 점수인 이유 · 영양성분 · 더 맞는 제품 · 쿠팡 고지, 아래 고정 줄.
 * 공유·♡·다른 목표 칩·더 보기·정보 수정 요청·비교함 담기의 동작은 3-2 상태 화면 작업에서 붙인다.
 */
export default async function ProductPage({
  params,
}: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = FIXTURE_PRODUCTS[id];
  if (!product) notFound();

  const { nutrition, reasons } = product;

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <header className="flex h-14 items-center gap-1 pr-4 pl-1">
        <BackButton fallbackHref="/home" />
        {/* 디자인 메모: 검색칸 → 2-3 검색 */}
        <SearchFieldLink
          href="/search"
          placeholder="제품명, 브랜드로 검색"
          className="min-w-0 flex-1"
        />
      </header>

      <main className="pb-[calc(76px+max(var(--safe-bottom),12px))]">
        <ProductHero
          meta={[product.brand, product.category].filter(Boolean).join(" · ")}
          name={product.name}
          image={
            product.image ? (
              <Image
                src={product.image.src}
                width={product.image.size}
                height={product.image.size}
                sizes="256px"
                alt=""
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <Thumb className="size-full" />
            )
          }
        />

        <section
          aria-label="점수"
          className="flex flex-col gap-3 px-5 pt-4 pb-6"
        >
          <div className="flex items-center gap-3.5">
            <ScoreRing score={product.score} band={product.band} size="L" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {product.rank && (
                <p className="text-[16px] leading-[26px] font-medium text-text-strong">
                  {product.category} {product.rank.total}개 중{" "}
                  {product.rank.position}위
                </p>
              )}
              {/* 디자인 메모: 점수 기준 보기 › → 5-4 */}
              <Link
                href="/grade-guide"
                className="flex items-center text-[13px] leading-5 font-medium text-text-sub"
              >
                점수 기준 보기
                <IconChevronRight className="size-4" />
              </Link>
            </div>
            <div className="flex items-center gap-[18px] text-icon-default">
              <button
                type="button"
                aria-label="공유"
                className="[&_svg]:size-[26px]"
              >
                <IconShare />
              </button>
              <button
                type="button"
                aria-label="저장"
                className="[&_svg]:size-7"
              >
                <IconHeart />
              </button>
            </div>
          </div>
          {/* 디자인 메모(11-05): 지금 기준 = 하늘색 바탕 + 파란 글자 · 다른 목표 = 흰 바탕 + 회색 테두리 */}
          <div className="flex gap-2">
            <span className="flex h-9 items-center rounded-full bg-accent-blue-weak px-3.5 text-body2-bold text-accent-blue-text">
              {GOAL_LABEL[product.goal]} · 내 목표
            </span>
            <button
              type="button"
              className="flex h-9 items-center rounded-full border border-line-strong bg-bg-page px-3.5 text-body2-medium text-text-strong"
            >
              {OTHER_GOAL_LABEL[product.goal]}
            </button>
          </div>
        </section>

        <Band />
        <section>
          <SectionHeader title="이 점수인 이유" />
          <div className="pt-2 pb-4">
            <ReasonGroup kind="good" title="좋은 점" items={reasons.good} />
            <ReasonGroup kind="bad" title="아쉬운 점" items={reasons.bad} />
          </div>
        </section>

        <Band />
        <section>
          <SectionHeader
            title="영양성분"
            description={[nutrition.basis, nutrition.serving]
              .filter(Boolean)
              .join(" · ")}
          />
          {nutrition.main.map((row) => (
            <Nutrient key={row.label} row={row} />
          ))}
          {nutrition.more.length > 0 && (
            <button
              type="button"
              className="flex items-center gap-1 px-5 py-3 text-body2-medium text-accent-blue-text"
            >
              다른 영양성분 {nutrition.more.length}개 더 보기
              <IconChevronDown className="size-4" />
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 px-5 pt-2 pb-7 text-body2-medium text-text-sub"
          >
            <IconFlag className="size-4" />
            정보 수정 요청
          </button>
        </section>

        {product.better.length > 0 && (
          <>
            <Band />
            <section>
              {/* 디자인 메모(11-05): 더 맞는 제품 · 전체 › → 3-4 더 맞는 제품(전체) */}
              <SectionHeader
                title="더 맞는 제품"
                actionLabel="전체"
                actionHref={`/product/${product.id}/better`}
              />
              <div className="flex gap-2.5 overflow-x-auto px-5 pt-1 pb-6">
                {product.better.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          </>
        )}

        {product.coupangUrl && (
          <p className="px-5 py-6 text-center text-caption text-text-sub">
            쿠팡 파트너스 활동의 일환으로,
            <br />
            이에 따른 일정액의 수수료를 제공받습니다.
          </p>
        )}
      </main>

      {/* 디자인 메모(11-04): 아래 고정 줄은 [비교함 담기] [쿠팡에서 보기]만, 위에 얇은 선 */}
      <BottomCta className="fixed-app bottom-0 z-30 border-t border-line-default">
        <Button
          type="button"
          kind="tertiary"
          // 디자인(쿠팡 상품이 없을 때): 「비교함 담기」만 가로 가득
          className={product.coupangUrl ? undefined : "flex-1"}
        >
          <IconCompare />
          비교함 담기
        </Button>
        {product.coupangUrl && (
          <Button className="flex-1" asChild>
            <a
              href={product.coupangUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              쿠팡에서 보기
            </a>
          </Button>
        )}
      </BottomCta>
    </div>
  );
}

function ReasonGroup({
  kind,
  title,
  items,
}: {
  kind: "good" | "bad";
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <>
      <h3 className="px-5 pt-3 pb-1 text-body2-bold text-text-sub">
        {title} {items.length}
      </h3>
      <ul className="flex flex-wrap gap-2 px-5 pt-1 pb-1.5">
        {items.map((text) => (
          <li key={text}>
            <ReasonChip kind={kind}>{text}</ReasonChip>
          </li>
        ))}
      </ul>
    </>
  );
}

function Nutrient({ row }: { row: NutrientRow }) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-2">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-body1-medium text-text-strong">{row.label}</p>
          <p className="text-body2 text-text-sub">{row.note}</p>
        </div>
        <p className="text-body1-medium text-text-strong">{row.amount}</p>
      </div>
      {row.percent !== null && (
        // 디자인 메모: 막대는 한 색. 좋음·걸림은 이유 칩으로만 보인다
        <div
          aria-hidden
          className="h-1.5 overflow-hidden rounded-[3px] bg-bg-band"
        >
          <div
            className="h-full rounded-[3px] bg-text-sub"
            style={{ width: `${Math.min(row.percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
