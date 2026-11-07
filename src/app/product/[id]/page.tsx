import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackButton } from "@/components/common/back-button";
import { Button } from "@/components/common/button";
import { Notice } from "@/components/common/notice";
import { ProductCard } from "@/components/common/product-card";
import { ProductHero } from "@/components/common/product-hero";
import { ReasonChip } from "@/components/common/reason-chip";
import { ScoreRing } from "@/components/common/score-ring";
import { SearchFieldLink } from "@/components/common/search-field";
import { SectionHeader } from "@/components/common/section-header";
import { Thumb } from "@/components/common/thumb";
import { IconChevronRight } from "@/components/icons";

import { FIXTURE_PRODUCTS, type Goal } from "./_fixtures";
import { NutritionSection } from "./nutrition-section";
import { FocusTarget, PreviewLink } from "./preview-focus";
import {
  ProductActions,
  ProductBottomBar,
  SaveButton,
  ShareButton,
} from "./product-actions";
import { ReportButton } from "./report-sheet";

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

const OTHER_GOAL: Record<Goal, Goal> = { diet: "muscle", muscle: "diet" };

function Band() {
  return <div aria-hidden className="h-2 bg-bg-band" />;
}

/*
 * 3-2 제품 결과. 위에서부터 제품 머리 · 점수 · 이 점수인 이유 · 영양성분 · 더 맞는 제품 · 쿠팡 고지, 아래 고정 줄.
 *
 * ?preview=muscle|diet — 3-2 다른 목표로 보기. 점수·순위·이유만 그 목표 기준으로 바꿔 보이고 내 목표 설정은 바꾸지 않는다.
 */
export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = FIXTURE_PRODUCTS[id];
  if (!product) notFound();

  const { preview: previewParam } = await searchParams;
  const otherGoal = OTHER_GOAL[product.goal];
  const previewView =
    previewParam === otherGoal ? product.preview[otherGoal] : undefined;
  // 미리 보는 중이면 점수·순위·이유를 그 목표 값으로 보인다
  const { score, band, rank, reasons } = previewView ?? product;
  const { nutrition } = product;

  return (
    <ProductActions previewing={Boolean(previewView)}>
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
        {previewView && (
          // 디자인: 미리보기 알림 줄(고정). 스크롤해도 화면 위에 붙어 있다
          <div className="sticky top-0 z-20 flex items-center bg-bg-tint pr-2">
            <FocusTarget className="flex-1 outline-none">
              <Notice>{GOAL_LABEL[otherGoal]} 목표로 미리 보는 중이에요</Notice>
            </FocusTarget>
            {/* 디자인 메모: 내 목표로 → 3-2 제품 결과 */}
            <Button kind="text" size="S" asChild>
              <PreviewLink href={`/product/${product.id}`}>
                내 목표로
              </PreviewLink>
            </Button>
          </div>
        )}

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

          <section aria-label="점수">
            <FocusTarget
              active={!previewView}
              className="flex flex-col gap-3 px-5 pt-4 pb-6 outline-none"
            >
              <div className="flex items-center gap-3.5">
                <ScoreRing score={score} band={band} size="L" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {rank && (
                    <p className="text-[16px] leading-[26px] font-medium text-text-strong">
                      {product.category} {rank.total}개 중 {rank.position}위
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
                  <ShareButton
                    path={`/product/${product.id}`}
                    title={product.name}
                  />
                  <SaveButton />
                </div>
              </div>
              {/* 디자인 메모(11-05): 지금 기준 = 하늘색 바탕 + 파란 글자 · 다른 목표 = 흰 바탕 + 회색 테두리 */}
              {previewView ? (
                <div className="flex gap-2">
                  <span className="flex h-9 items-center rounded-full bg-accent-blue-weak px-3.5 text-body2-bold text-accent-blue-text">
                    {GOAL_LABEL[otherGoal]} · 미리 보기
                  </span>
                  {/* 디자인 메모: 누르는 곳이 아닌 정보 글자 */}
                  <span className="flex h-9 items-center rounded-full border border-line-strong bg-bg-page px-3.5 text-body2-medium text-text-strong">
                    내 목표({GOAL_LABEL[product.goal]})로는 {product.score}점
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <span className="flex h-9 items-center rounded-full bg-accent-blue-weak px-3.5 text-body2-bold text-accent-blue-text">
                    {GOAL_LABEL[product.goal]} · 내 목표
                  </span>
                  {product.preview[otherGoal] && (
                    <PreviewLink
                      href={`/product/${product.id}?preview=${otherGoal}`}
                      className="flex h-9 items-center rounded-full border border-line-strong bg-bg-page px-3.5 text-body2-medium text-text-strong"
                    >
                      {OTHER_GOAL_LABEL[product.goal]}
                    </PreviewLink>
                  )}
                </div>
              )}
            </FocusTarget>
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
          <NutritionSection nutrition={nutrition} />
          <ReportButton />

          {/* 디자인 「다른 목표로 보기」 화면에는 더 맞는 제품 칸이 없다(더 맞는 제품은 내 목표 기준이라) */}
          {!previewView && product.better.length > 0 && (
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

        <ProductBottomBar
          coupangUrl={product.coupangUrl}
          thumbnail={product.image?.src ?? null}
        />
      </div>
    </ProductActions>
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
