import type { Metadata } from "next";
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
import { IconChevronRight } from "@/components/icons";
import { cn } from "@/lib/utils";

import { FIXTURE_PRODUCTS, type Goal, type GoalView } from "./_fixtures";
import { NutritionSection } from "./nutrition-section";
import { FocusTarget, PreviewLink } from "./preview-focus";
import {
  ProductActions,
  ProductBottomBar,
  SaveButton,
  ShareButton,
} from "./product-actions";
import { ProductPhoto } from "./product-photo";
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

  const { preview: previewParam, goal: goalParam, state } = await searchParams;
  const views: Partial<Record<Goal, GoalView>> = {
    ...product.preview,
    [product.goal]: product,
  };
  // 3-2 공유 링크·목표 없음: 목표를 고른 적 없는 사람은 다이어트 기준으로 보인다(디자인 메모).
  // 1-5에서 고르고 돌아오면 ?goal=로 그 목표를 내 목표로 본다. 목표 저장·조회는 API 연결 때 사용자 정보로 바꾼다
  const noGoal = state === "no-goal";
  const wanted = noGoal ? "diet" : goalParam;
  const goal: Goal =
    (wanted === "diet" || wanted === "muscle") && views[wanted]
      ? wanted
      : product.goal;
  const mine = views[goal]!;
  const otherGoal = OTHER_GOAL[goal];
  const previewView = previewParam === otherGoal ? views[otherGoal] : undefined;
  // 미리 보기를 켜고 꺼도 목표 없음·고른 목표 표시는 주소에 남긴다
  const keep = noGoal
    ? "state=no-goal"
    : goal !== product.goal
      ? `goal=${goal}`
      : "";
  const productHref = (extra?: string) => {
    const query = [keep, extra].filter(Boolean).join("&");
    return `/product/${product.id}${query ? `?${query}` : ""}`;
  };
  // 미리 보는 중이면 점수·순위·이유를 그 목표 값으로 보인다
  const { score, band, rank, reasons } = previewView ?? mine;
  const { nutrition } = product;
  // 내 몸에 맞추기는 다이어트 등급에만 쓴다. 지금 보이는 등급이 다이어트 기준일 때만 맞춘 값이다
  const shownGoal = previewView ? otherGoal : goal;
  // 목표를 고른 적 없는 사람(목표 없음, 1-5에서 막 고르고 돌아온 ?goal=)은 내 몸에 맞추기도 켠 적이 없다
  const fresh = noGoal || goalParam !== undefined;
  const bodyFit =
    !fresh && product.bodyFitKcal !== null && shownGoal === "diet";

  // 디자인 「다른 목표로 보기」 화면에는 더 맞는 제품 칸이 없다(더 맞는 제품은 내 목표 기준이라)
  const betterSection = !previewView && product.better.length > 0 && (
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
  );
  // 디자인 메모(생산 중단): 더 맞는 제품 칸이 점수 바로 아래로 올라온다. 단종이면 쿠팡 버튼·고지가 없다
  const stopped = product.production !== null;
  const coupangUrl =
    product.production?.inStock === false ? null : product.coupangUrl;
  const noBetter = !previewView && product.better.length === 0;
  // 쿠팡 상품을 못 찾은 경우만. 단종이라 쿠팡 버튼을 뺀 경우는 이 안내를 띄우지 않는다
  const noCoupang = product.coupangUrl === null;

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
              <PreviewLink href={productHref()}>내 목표로</PreviewLink>
            </Button>
          </div>
        )}

        <main className="pb-[calc(76px+max(var(--safe-bottom),12px))]">
          <ProductHero
            // 디자인 메모(생산 중단): 브랜드 줄 끝에 받은 상태 글자 그대로
            meta={[product.brand, product.category, product.production?.label]
              .filter(Boolean)
              .join(" · ")}
            name={product.name}
            image={
              <ProductPhoto key={product.image?.src} image={product.image} />
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
                    내 목표({GOAL_LABEL[goal]})로는 {mine.score}점
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <span className="flex h-9 items-center rounded-full bg-accent-blue-weak px-3.5 text-body2-bold text-accent-blue-text">
                    {/* 디자인 메모(내 몸에 맞춤): 다이어트 목표면 칩 글자만 바뀐다. 근육 증가는 그대로 */}
                    {GOAL_LABEL[goal]} ·{" "}
                    {bodyFit ? "내 몸에 맞추기" : "내 목표"}
                  </span>
                  {views[otherGoal] && (
                    <PreviewLink
                      href={productHref(`preview=${otherGoal}`)}
                      className="flex h-9 items-center rounded-full border border-line-strong bg-bg-page px-3.5 text-body2-medium text-text-strong"
                    >
                      {OTHER_GOAL_LABEL[goal]}
                    </PreviewLink>
                  )}
                </div>
              )}
              {stopped && (
                <p className="rounded-xl bg-bg-band px-4 py-3 text-[14px] leading-[21px] text-text-body">
                  제조사가 생산을 멈춘 제품이에요.
                  {/* 더 맞는 제품이 없으면 아래 「아직 찾지 못했어요」와 어긋나 뺀다(디자인에 없는 조합, UI 플랜 「남은 질문」 12) */}
                  {product.better.length > 0 && (
                    <>
                      <br />
                      비슷한 제품을 찾아볼 수 있어요.
                    </>
                  )}
                </p>
              )}
            </FocusTarget>
          </section>
          {noGoal && !previewView && (
            // 디자인 메모(공유 링크, 목표 없음): 줄 → 1-5, 고르면 가이드 없이 같은 제품 결과로 돌아온다
            <Link
              href={`/intro/goal?next=/product/${product.id}`}
              className="flex items-center gap-2 bg-brand-primary-weak px-5 py-3 text-body2"
            >
              <span className="min-w-0 flex-1 text-text-strong">
                지금은 {GOAL_LABEL[goal]} 목표예요
              </span>
              <span className="shrink-0 font-bold text-brand-link">
                내 목표 고르기 <span aria-hidden>›</span>
              </span>
            </Link>
          )}
          {stopped && betterSection}

          <Band />
          <section>
            <SectionHeader title="이 점수인 이유" />
            <div className="pt-2 pb-4">
              <ReasonGroup kind="good" title="좋은 점" items={reasons.good} />
              {/* 디자인 메모(더 맞는 제품이 없을 때): 아쉬운 점이 없으면 그 자리에 이 문장 */}
              <ReasonGroup
                kind="bad"
                title="아쉬운 점"
                items={reasons.bad}
                empty="이 목표에서 아쉬운 점이 없어요"
              />
            </div>
          </section>

          <Band />
          <NutritionSection
            nutrition={nutrition}
            bodyFitKcal={bodyFit ? product.bodyFitKcal : null}
          />
          <ReportButton />
          {(noBetter || noCoupang) && (
            <div className="flex flex-col gap-1.5 px-5 pb-3 text-body2">
              {noBetter && (
                // 디자인 메모(더 맞는 제품이 없을 때): 「정보가 틀렸어요」 아래 한 줄. A·B 등급이면 이미 높은 편, C~E면 아직 못 찾음
                <p
                  className={cn(
                    "font-medium",
                    mine.band <= 2 ? "text-brand-link" : "text-text-sub",
                  )}
                >
                  {mine.band <= 2 ? (
                    <>
                      <span aria-hidden>✓</span> 이미 이 종류에서 점수가 높은
                      편이에요
                    </>
                  ) : (
                    "같은 종류에서 더 맞는 제품을 아직 찾지 못했어요"
                  )}
                </p>
              )}
              {noCoupang && (
                // 디자인 「쿠팡 상품이 없을 때」: 살 곳 대신 같은 종류 순위로 이어 준다
                <>
                  <p className="text-text-sub">
                    쿠팡에서 파는 상품을 찾지 못했어요
                  </p>
                  {/* 2-2 등급 순위. 종류를 고른 채로 여는 주소는 07단계에서 정한다 */}
                  <Link
                    href="/ranking"
                    className="self-start font-medium text-brand-link"
                  >
                    같은 종류 순위 보기 <span aria-hidden>›</span>
                  </Link>
                </>
              )}
            </div>
          )}

          {!stopped && betterSection}

          {coupangUrl && (
            <p className="px-5 py-6 text-center text-caption text-text-sub">
              쿠팡 파트너스 활동의 일환으로,
              <br />
              이에 따른 일정액의 수수료를 제공받습니다.
            </p>
          )}
        </main>

        <ProductBottomBar
          coupangUrl={coupangUrl}
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
  empty,
}: {
  kind: "good" | "bad";
  title: string;
  items: string[];
  /** 항목이 없을 때 머리 아래 보일 문장. 없으면 묶음째 숨긴다 */
  empty?: string;
}) {
  if (items.length === 0) {
    if (!empty) return null;
    return (
      <>
        <h3 className="px-5 pt-3 pb-1 text-body2-bold text-text-sub">
          {title}
        </h3>
        <p className="px-5 pt-1 pb-1.5 text-body2 text-text-sub">{empty}</p>
      </>
    );
  }
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
