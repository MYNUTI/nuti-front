import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { ProductRow } from "@/components/common/product-row";
import { SectionHeader } from "@/components/common/section-header";
import { StatusTag } from "@/components/common/status-tag";
import { TopBarButton } from "@/components/common/top-bar";
import { IconBack, IconSearch } from "@/components/icons";

import { FIXTURE_NO_SCORE, type NoScoreProduct } from "../../_fixtures";
import { ReportAction } from "./report-action";

export async function generateMetadata({
  params,
}: PageProps<"/contribute/product/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: FIXTURE_NO_SCORE[id]?.name ?? "아직 점수가 없는 제품" };
}

// 3-2와 같은 목표 이름
const GOAL_LABEL: Record<NoScoreProduct["goal"], string> = {
  diet: "다이어트",
  muscle: "근육 증가",
};

const REQUESTED_TEXT: Record<
  NonNullable<NoScoreProduct["requested"]>,
  string
> = {
  others: "먼저 요청한 분이 있었어요. 분석이 끝나면 바로 볼 수 있어요.",
  mine: "이미 요청하셨어요. 분석이 끝나면 바로 볼 수 있어요.",
};

/*
 * 3-6 아직 점수가 없는 제품(검색이나 기록에서, 【최종】 ③ 9306:11618) — 2-4 검색 결과 · 4-1 내 기록에서 「점수 없음」
 * 제품을 누르면 여는 전체 화면(시트가 아니다). 위 줄은 뒤로(→ 2-1 홈) · 검색만(점수가 없어 ♡ · 공유 없음).
 * 제품 머리(사진 96 · 브랜드 · 이름 · 「점수 없음」) · 「아직 점수가 없는 제품이에요」, 같은 종류에서 점수가 있는 제품
 * (0개면 숨김), 「정보 수정 요청」(→ 정보가 틀렸어요 시트), 아래 고정 「영양성분표 찍고 점수 보기」(→ 3-7).
 * API 연결 전 미리 보기 주소 값: ?state=others · mine — 먼저 요청 · 이미 요청, ?state=alone — 같은 종류 제품 0개
 */
export default async function NoScorePage({
  params,
  searchParams,
}: PageProps<"/contribute/product/[id]">) {
  const { id } = await params;
  const { state } = await searchParams;
  const fixture = FIXTURE_NO_SCORE[id];
  if (!fixture) notFound();
  const product: NoScoreProduct = {
    ...fixture,
    requested:
      state === "others" || state === "mine" ? state : fixture.requested,
    similar: state === "alone" ? [] : fixture.similar,
  };

  return (
    <main className="flex flex-1 flex-col bg-bg-page pt-safe pb-[calc(76px+max(var(--safe-bottom),12px))]">
      <header className="flex h-13 items-center justify-between px-1">
        {/* 【최종】 메모: 뒤로(‹) → 2-1 홈. 이전 화면은 기기 뒤로 가기로 */}
        <TopBarButton asChild aria-label="홈으로">
          <Link href="/home">
            <IconBack />
          </Link>
        </TopBarButton>
        <TopBarButton asChild aria-label="검색">
          <Link href="/search">
            <IconSearch />
          </Link>
        </TopBarButton>
      </header>

      <div className="flex items-center gap-4 px-5 pt-2 pb-4">
        <span className="relative size-24 shrink-0 overflow-hidden rounded-md bg-bg-tint">
          <Image
            src={product.image ?? "/common/no-photo.png"}
            fill
            sizes="96px"
            alt=""
            className={product.image ? "object-contain" : "object-cover"}
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {product.brand && (
            <p className="text-body2 text-text-sub">{product.brand}</p>
          )}
          <h1 className="text-title2 break-keep text-text-strong">
            {product.name}
          </h1>
          <p className="pt-2">
            <StatusTag status="noScore" />
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-5 pb-4">
        <p className="text-title2 text-text-strong">
          아직 점수가 없는 제품이에요
        </p>
        {product.requested && (
          <p className="text-body2 text-text-sub">
            {REQUESTED_TEXT[product.requested]}
          </p>
        )}
      </div>

      {product.similar.length > 0 && (
        <>
          <div aria-hidden className="h-2 bg-bg-band" />
          <section aria-labelledby="similar-title">
            <SectionHeader
              title={
                <span id="similar-title">같은 종류에서 점수가 있는 제품</span>
              }
              description={`${GOAL_LABEL[product.goal]} 목표`}
            />
            <ul>
              {product.similar.map((p) => (
                <li key={p.id}>
                  <ProductRow
                    href={p.href ?? `/product/${p.id}`}
                    brand={p.brand}
                    name={p.name}
                    meta={p.meta}
                    score={p.score}
                    image={
                      p.image && (
                        <Image
                          src={p.image}
                          width={128}
                          height={128}
                          sizes="56px"
                          alt=""
                        />
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <ReportAction />

      <BottomCta className="fixed-app bottom-0 z-20">
        <Button kind="primary" className="flex-1" asChild>
          <Link
            href={`/contribute/label?product=${encodeURIComponent(product.id)}`}
          >
            영양성분표 찍고 점수 보기
          </Link>
        </Button>
      </BottomCta>
    </main>
  );
}
