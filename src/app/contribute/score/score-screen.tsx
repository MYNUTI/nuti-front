"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { useGoBack } from "@/components/common/back-button";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { ListRow } from "@/components/common/list-row";
import { Notice } from "@/components/common/notice";
import { ScoreRing } from "@/components/common/score-ring";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconClose, IconSearch } from "@/components/icons";

import type { MyScore } from "../_fixtures";
import { clearLabelPhoto, getLabelDraft } from "../label-photo";

const noop = () => () => {};

// 3-2와 같은 목표 이름
const GOAL_LABEL: Record<MyScore["goal"], string> = {
  diet: "다이어트",
  muscle: "근육 증가",
};

/*
 * 3-9 점수 확인(【최종】 ⑦ 9306:21750). 내가 찍은 값으로 낸 점수.
 * 위 줄 검색 · ✕(→ 2-1 홈), 제품 머리(3-2와 같은 틀: 사진 96 · 브랜드 · 이름 · 점수 링 + 종류 · 「목표 · 확인 중」), 한 줄 해석,
 * 안내 상자, 「읽은 값 보기」(→ 3-8) · 「○○ 순위 보기」(→ 2-2 그 종류), 아래 「다른 제품 찍기」 · 「분석 요청 보기」.
 * - 운영팀 확인 전 점수라 순위 · 3-2 결과는 보이지 않는다(메모)
 * - 이미 요청돼 있던 제품이면 안내 상자 문장이 바뀐다. 값이 모자라 점수를 못 내면 점수 · 해석 · 순위 줄 없이
 *   「분석 요청 보기」만(메모)
 * - 흐름을 끝내는 곳(✕ · 다른 제품 찍기 · 분석 요청 보기)에서 사진과 적은 값을 지운다(메모: 확인이 끝나면 지움).
 *   이 화면을 바꿔 가서(replace) 뒤로 가기에 값이 빠진 3-9가 다시 나오지 않게 한다
 */
export function ScoreScreen({
  result,
  product,
  fallbackName,
  checkHref,
}: {
  result: MyScore;
  /** 3-6 전체 화면에서 왔으면 그 제품 */
  product: { brand: string | null; name: string; image: string | null } | null;
  /** 3-8을 거치지 않고 열렸을 때 쓸 이름(주소 값) */
  fallbackName: string;
  checkHref: string;
}) {
  const backToCheck = useGoBack(checkHref);
  // 3-8에서 적은 이름. 서버 렌더 · 하이드레이션 첫 렌더는 주소 값 · 제품 이름
  const draftName = useSyncExternalStore(
    noop,
    () => getLabelDraft()?.name ?? null,
    () => null,
  );
  const name = draftName || product?.name || fallbackName || "이름 없는 제품";
  const { score } = result;

  return (
    <main className="flex flex-1 flex-col bg-bg-page pt-safe">
      <TopBar
        right={
          <>
            <TopBarButton asChild aria-label="검색">
              <Link href="/search">
                <IconSearch />
              </Link>
            </TopBarButton>
            <TopBarButton asChild aria-label="닫기">
              <Link href="/home" replace onClick={clearLabelPhoto}>
                <IconClose />
              </Link>
            </TopBarButton>
          </>
        }
      />

      <div className="flex items-center gap-4 px-5 pt-2 pb-4">
        <span className="relative size-24 shrink-0 overflow-hidden rounded-md bg-bg-tint">
          <Image
            src={product?.image ?? "/common/no-photo.png"}
            fill
            sizes="96px"
            alt=""
            className={product?.image ? "object-contain" : "object-cover"}
          />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {product?.brand && (
            <p className="text-body2 text-text-sub">{product.brand}</p>
          )}
          <h1 className="text-title2 break-keep text-text-strong">{name}</h1>
          <p className="flex items-center gap-2 pt-2 text-body1 text-text-sub">
            {score && (
              <ScoreRing score={score.value} band={score.band} size="M" />
            )}
            {result.category.name}
          </p>
          <p className="text-body2 text-text-sub">
            {GOAL_LABEL[result.goal]} 목표 · 확인 중
          </p>
        </div>
      </div>

      {result.headline && (
        <p className="px-5 pb-4 text-title2 text-text-strong">
          {result.headline}
        </p>
      )}

      <div className="px-5 pb-4">
        <Notice className="rounded-md px-3.5 break-keep">
          {!score ? (
            <>
              값이 모자라 아직 점수를 계산하지 못했어요. 운영팀이 확인한 뒤 기록{" "}
              <span aria-hidden>›</span> 분석 요청에서 알려 드려요.
            </>
          ) : result.requestedBefore ? (
            <>
              먼저 요청한 분이 있었어요.
              <br />
              함께 더 정확해졌어요.
            </>
          ) : (
            <>
              앱에 아직 없던 제품이에요.
              <br />
              운영팀이 숫자를 확인하기 전까지는
              <br />
              나만 볼 수 있는 점수예요.
            </>
          )}
        </Notice>
      </div>

      <div aria-hidden className="h-2 bg-bg-band" />
      <ListRow
        title="읽은 값 보기"
        description="포장과 다르면 고쳐서 다시 볼 수 있어요"
        onClick={backToCheck}
      />
      {score && (
        <ListRow
          title={`${result.category.name} 순위 보기`}
          description="같은 종류에서 점수가 높은 제품을 볼 수 있어요"
          href={`/ranking/${result.category.code}`}
        />
      )}

      <div className="min-h-6 flex-1" />
      <BottomCta>
        <div className="flex w-full gap-2">
          {score && (
            <Button kind="secondary" className="flex-1" asChild>
              <Link href="/scan" replace onClick={clearLabelPhoto}>
                다른 제품 찍기
              </Link>
            </Button>
          )}
          <Button kind="primary" className="flex-1" asChild>
            <Link
              href="/history?tab=requests"
              replace
              onClick={clearLabelPhoto}
            >
              분석 요청 보기
            </Link>
          </Button>
        </div>
      </BottomCta>
    </main>
  );
}
