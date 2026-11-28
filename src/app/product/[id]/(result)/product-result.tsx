"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/common/button";
import { Notice } from "@/components/common/notice";
import { ProductCard } from "@/components/common/product-card";
import { ProductHero } from "@/components/common/product-hero";
import { ReasonChip } from "@/components/common/reason-chip";
import { ScoreRing } from "@/components/common/score-ring";
import { SectionHeader } from "@/components/common/section-header";
import { IconChevronRight } from "@/components/icons";
import { useProductDetail } from "@/lib/product/queries";
import type { Alternative } from "@/lib/product/types";
import { cn } from "@/lib/utils";

import type { CoupangPrice, Goal, GoalView } from "../model";
import { NutritionSection } from "../nutrition-section";
import { FocusTarget, PreviewLink } from "../preview-focus";
import {
  ProductActions,
  ProductBottomBar,
  SaveButton,
  ShareButton,
} from "../product-actions";
import { ProductTopBar } from "../product-loading";
import { ProductPhoto } from "../product-photo";
import { ReportButton } from "../report-sheet";
import { toScreenProduct } from "../to-screen";

const GOAL_LABEL: Record<Goal, string> = {
  diet: "다이어트",
  muscle: "근육 증가",
};

// 【최종】 메모: 목표가 근육 증가면 「근육 증가 · 내 목표」 + 「다이어트로 보기」
const OTHER_GOAL_LABEL: Record<Goal, string> = {
  diet: "근육 증가로 보기",
  muscle: "다이어트로 보기",
};

const OTHER_GOAL: Record<Goal, Goal> = { diet: "muscle", muscle: "diet" };

const GOAL_CHIP =
  "flex h-9 items-center rounded-full bg-accent-blue-weak px-3.5 text-body2-bold text-accent-blue-text";

/** 【최종】 가격 줄: 「쿠팡」 · 기준일은 14 회색, 판매가는 16 굵게. 올해가 아니면 연도까지 붙인다 */
function CoupangPriceLine({ price }: { price: CoupangPrice }) {
  const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
  return (
    <p className="flex flex-wrap items-baseline gap-x-1 pb-1 text-body2 text-text-sub">
      <span>쿠팡</span>
      {price.kind === "single" && (
        <span className="text-[16px] leading-6 font-bold text-text-strong">
          {won(price.amount)}
        </span>
      )}
      {price.kind === "bundle" && (
        <>
          <span className="self-center rounded-[4px] bg-bg-band px-1.5 py-0.5 text-[11px] leading-4 text-text-body">
            {price.count}개 묶음
          </span>
          <span className="text-[16px] leading-6 font-bold text-text-strong">
            1개당 {won(price.unitAmount)}
          </span>
        </>
      )}
      {price.kind === "otherSize" ? (
        <span className="self-center rounded-[4px] bg-bg-band px-1.5 py-0.5 text-[11px] leading-4 text-text-body">
          다른 용량
        </span>
      ) : (
        <span>· {priceDate(price.date)} 기준</span>
      )}
    </p>
  );
}

function priceDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  // 서버 시간대가 UTC여도 한국 날짜로 「올해」를 정한다
  const thisYear = Number(
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: "Asia/Seoul",
    }).format(new Date()),
  );
  return `${year === thisYear ? "" : `${year}년 `}${month}월 ${day}일`;
}

function Band() {
  return <div aria-hidden className="h-2 bg-bg-band" />;
}

/*
 * 3-2 제품 결과 본문. 서버(page.tsx)가 상세를 한 번 조회해 HydrationBoundary로 넘기고, 여기서 `useProductDetail`로
 * 이어 쓴다(staleTime Infinity라 다시 부르지 않는다). 즐겨찾기는 그 캐시를 고쳐(`setQueryData`) 다른 화면에 갔다 와도 맞다.
 * 「다른 목표로 보기」는 두 목표 결과가 한 응답에 있어 주소(`?preview=`)만 바꾸고 서버를 다시 부르지 않는다(PreviewLink).
 */
export function ProductResultView({
  id,
  goal,
  noGoal,
  previewNoGoal,
  alternatives,
  failPreview,
}: {
  id: string;
  /** 내 목표. 고른 적이 없으면 다이어트 */
  goal: Goal;
  /** 목표를 고른 적이 없다(공유 링크 · 목표 없음) */
  noGoal: boolean;
  /** 확인용 `?state=no-goal` */
  previewNoGoal: boolean;
  /** 더 맞는 제품 첫 페이지(내 목표 기준) */
  alternatives: Alternative[];
  /** 확인용 `?state=report-failed` */
  failPreview: boolean;
}) {
  const { data } = useProductDetail(id);
  const previewParam = useSearchParams().get("preview");
  // 서버가 캐시에 넣어 둔 값이 늘 있다. 점수 없는 제품은 서버가 3-6으로 보낸다
  const product = data && toScreenProduct(data, goal, alternatives);
  if (!product) return null;
  const views: Partial<Record<Goal, GoalView>> = {
    ...product.preview,
    [product.goal]: product,
  };
  const mine = views[goal]!;
  const otherGoal = OTHER_GOAL[goal];
  const previewView = previewParam === otherGoal ? views[otherGoal] : undefined;
  // 미리 보기를 켜고 꺼도 목표 없음 확인용 값(?state=no-goal)은 주소에 남긴다
  const keep = previewNoGoal ? "state=no-goal" : "";
  const productHref = (extra?: string) => {
    const query = [keep, extra].filter(Boolean).join("&");
    return `/product/${product.id}${query ? `?${query}` : ""}`;
  };
  // 미리 보는 중이면 점수·순위·이유를 그 목표 값으로 보인다
  const { score, band, rank, reasons } = previewView ?? mine;
  const { nutrition } = product;
  // 내 몸에 맞추기는 다이어트 등급에만 쓴다. 지금 보이는 등급이 다이어트 기준일 때만 맞춘 값이다
  const shownGoal = previewView ? otherGoal : goal;
  // 목표를 고른 적 없는 사람은 내 몸에 맞추기도 켠 적이 없다
  const fresh = noGoal;
  const bodyFit =
    !fresh && product.bodyFitKcal !== null && shownGoal === "diet";

  // 디자인 「다른 목표로 보기」 화면에는 더 맞는 제품 칸이 없다(더 맞는 제품은 내 목표 기준이라).
  // 【최종】 메모: 점수가 중간 이하일 때만 보인다. 높음 이상이면 이 구역이 없다
  const lowScore = mine.band >= 3;
  const showBetter = !previewView && lowScore && product.better.length > 0;
  const betterSection = showBetter && (
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
  // 디자인 메모(생산 중단): 더 맞는 제품 칸이 점수 바로 아래로 올라온다. 단종이면(쿠팡 링크 없음) 쿠팡 버튼·고지가 없다
  const stopped = product.production !== null;
  const coupangUrl = product.coupangUrl;
  // 【최종】 메모: 같은 종류에서 가장 높으면(높음 이상 · 더 맞는 제품 없음) ✓ 줄, 중간 이하인데 못 찾았으면 「아직 찾지 못했어요」.
  // 구간만 높고 더 높은 제품이 있으면 이 줄을 뺀다
  const noBetter = !previewView && product.better.length === 0;
  // 쿠팡 상품을 못 찾은 경우만. 단종(생산 중단 상태 + 쿠팡 링크 없음)은 이 안내를 띄우지 않는다
  const noCoupang = coupangUrl === null && !stopped;

  return (
    <ProductActions
      product={{
        id: product.id,
        name: product.name,
        image: product.image?.src ?? null,
      }}
      saved={product.saved}
      previewing={Boolean(previewView)}
    >
      <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
        <ProductTopBar />
        {previewView && (
          // 디자인: 미리보기 알림 줄(고정). 스크롤해도 화면 위에 붙어 있다
          <div className="sticky top-0 z-20 flex items-center bg-bg-tint pr-2">
            <FocusTarget className="flex-1 outline-none">
              <Notice>{GOAL_LABEL[otherGoal]} 목표로 미리 보는 중이에요</Notice>
            </FocusTarget>
            {/* 디자인 메모: 내 목표로 보기 → 3-2 제품 결과 */}
            <Button kind="text" size="S" asChild>
              <PreviewLink href={productHref()}>내 목표로 보기</PreviewLink>
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
            // 디자인 메모(11-09): 환자용 균형영양식이면 이름 아래 한 줄. 3-2는 기준량 줄을 쓰지 않아 그 자리를 빌린다
            basis={product.patientFood ? "환자용 식품이에요" : undefined}
            image={
              <ProductPhoto key={product.image?.src} image={product.image} />
            }
          />

          <section aria-label="점수">
            <FocusTarget
              active={!previewView}
              className="flex flex-col gap-3 px-5 pt-4 pb-6 outline-none"
            >
              {/* 【최종】 가격 줄: 점수 줄 위. 누르는 곳이 아니다. 품절이면 뺀다 */}
              {!product.coupangSoldOut && product.coupangPrice && (
                <CoupangPriceLine price={product.coupangPrice} />
              )}
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
                  {/* 【최종】 메모: 누르면 3-2 제품 결과(내 목표) */}
                  <PreviewLink
                    href={productHref()}
                    className="flex h-9 items-center rounded-full border border-line-strong bg-bg-page px-3.5 text-body2-medium text-text-strong"
                  >
                    내 목표({GOAL_LABEL[goal]})로는 {mine.score}점
                  </PreviewLink>
                </div>
              ) : (
                <div className="flex gap-2">
                  {/* 디자인 메모(내 몸에 맞춤): 다이어트 목표면 칩 글자만 바뀐다. 근육 증가는 그대로.
                      【최종】: 목표 칩은 표시만 하고, 「내 몸에 맞춤」 칩만 누르면 5-7 내 몸에 맞추기.
                      공유 링크 · 목표 없음이면 「다이어트 기준」 */}
                  {bodyFit ? (
                    <Link href="/my/body" className={GOAL_CHIP}>
                      {GOAL_LABEL[goal]} · 내 몸에 맞춤
                    </Link>
                  ) : (
                    <span className={GOAL_CHIP}>
                      {GOAL_LABEL[goal]} {noGoal ? "기준" : "· 내 목표"}
                    </span>
                  )}
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
                <p className="rounded-md bg-bg-band px-4 py-3 text-[14px] leading-[21px] text-text-body">
                  제조사가 생산을 멈춘 제품이에요.
                  {/* 더 맞는 제품 칸이 보일 때만 붙인다. 없으면 이어 볼 곳이 없거나 아래 「아직 찾지 못했어요」와 어긋난다
                      (디자인에 없는 조합, UI 플랜 「남은 질문」 12) */}
                  {showBetter && (
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
                {GOAL_LABEL[goal]} 목표로 본 점수예요
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
          <ReportButton productId={product.id} failPreview={failPreview} />
          {(noBetter || noCoupang) && (
            <div className="flex flex-col gap-1.5 px-5 pb-3 text-body2">
              {noBetter && (
                // 디자인 메모(더 맞는 제품이 없을 때): 「정보가 틀렸어요」 아래 한 줄. 높음 이상이면 같은 종류에서 가장 높음, 중간 이하면 아직 못 찾음
                <p
                  className={cn(
                    "font-medium",
                    lowScore ? "text-text-sub" : "text-brand-link",
                  )}
                >
                  {!lowScore ? (
                    <>
                      <span aria-hidden>✓</span> 마이뉴티에서 점수를 매긴 같은
                      종류 제품 중 가장 높아요
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
                    쿠팡에서 이 제품을 찾지 못했어요
                  </p>
                  <Link
                    href={
                      product.categoryCode
                        ? `/ranking/${encodeURIComponent(product.categoryCode)}`
                        : "/ranking"
                    }
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
          soldOut={product.coupangSoldOut === true}
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
      {/* 디자인 메모(11-09): 머리에 개수를 붙이지 않는다 */}
      <h3 className="px-5 pt-3 pb-1 text-body2-bold text-text-sub">{title}</h3>
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
