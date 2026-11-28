import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";

import { getQueryClient } from "@/lib/api/query-client";
import { readServerDeviceGoal } from "@/lib/goal/device.server";
import { productKeys } from "@/lib/product/keys";
import {
  getAlternativesFirstPage,
  getProductDetail,
} from "@/lib/product/server";

import type { Goal } from "../model";
import { ProductError } from "../product-error";
import { ProductLoading } from "../product-loading";
import { API_GOAL, SCREEN_GOAL } from "../to-screen";
import { ProductResultView } from "./product-result";

export async function generateMetadata({
  params,
}: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: (await getProductDetail(id))?.name ?? "제품 정보" };
}

/*
 * 3-2 제품 결과. 위에서부터 제품 머리 · 점수 · 이 점수인 이유 · 영양성분 · 더 맞는 제품 · 쿠팡 고지, 아래 고정 줄.
 *
 * ?state=loading|error — 3-2 불러오는 중·불러오지 못했을 때(확인용) · ?state=no-goal — 3-2 공유 링크·목표 없음 ·
 * ?state=report-failed — 정보가 틀렸어요 시트에서 보내기가 실패했을 때
 * ?preview=muscle|diet — 3-2 다른 목표로 보기. 점수·순위·이유만 그 목표 기준으로 바꿔 보이고 내 목표 설정은 바꾸지 않는다.
 */
export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/product/[id]">) {
  const { id } = await params;
  const { goal: goalParam, state } = await searchParams;
  // 3-2 불러오는 중 확인용. 실제 로딩은 loading.tsx가 같은 화면을 그린다
  if (state === "loading") return <ProductLoading />;
  // 3-2 불러오지 못했을 때 확인용. 실제 실패는 error.tsx가 같은 화면을 그린다
  if (state === "error") return <ProductError />;

  const detail = await getProductDetail(id);
  if (!detail) notFound();
  // 점수가 없는 제품은 3-6 아직 점수가 없는 제품(검색이나 기록에서)이 맡는다(기능명세)
  if (!detail.goals) redirect(`/contribute/product/${encodeURIComponent(id)}`);

  // 3-2 공유 링크·목표 없음: 목표를 고른 적 없는 사람은 다이어트 기준으로 보인다(디자인 메모 · ONB_008).
  // 내 목표는 기기 쿠키다. 1-5에서 고르고 돌아온 ?goal=은 1-5가 목표를 기기에 저장하기 전(12-3)까지만 쓴다
  // TODO(API 12-3): 1-5가 기기 목표를 저장하면 ?goal=을 지운다
  const deviceGoal = await readServerDeviceGoal();
  const urlGoal =
    deviceGoal === null && (goalParam === "diet" || goalParam === "muscle")
      ? goalParam
      : null;
  const noGoal = state === "no-goal" || (deviceGoal === null && !urlGoal);
  const goal: Goal = noGoal
    ? "diet"
    : deviceGoal
      ? SCREEN_GOAL[deviceGoal]
      : urlGoal!;
  // 더 맞는 제품은 내 목표 기준이다. 서버가 있다고 할 때만 목록을 부른다.
  // 보조 구역이라 실패해도 3-2를 깨뜨리지 않고 빈 목록으로 그린다(「아직 찾지 못했어요」) — 다시 시도하면 상세 조회수가 또 오른다
  const alternatives =
    detail.goals[API_GOAL[goal]].better.status === "AVAILABLE"
      ? ((await getAlternativesFirstPage(id, API_GOAL[goal]).catch(() => null))
          ?.items ?? [])
      : [];

  const queryClient = getQueryClient();
  queryClient.setQueryData(productKeys.detail(id), detail);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductResultView
        id={id}
        goal={goal}
        noGoal={noGoal}
        urlGoal={urlGoal}
        previewNoGoal={state === "no-goal"}
        alternatives={alternatives}
        failPreview={state === "report-failed"}
      />
    </HydrationBoundary>
  );
}
