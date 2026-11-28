import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BackButton } from "@/components/common/back-button";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";
import { readServerDeviceGoal } from "@/lib/goal/device.server";
import { getAlternativesFirstPage } from "@/lib/product/server";

import {
  GRADE_BAND,
  SCREEN_GOAL,
  toBetterItems,
  toScore,
} from "../../to-screen";
import { PickList } from "./pick-list";

export const metadata: Metadata = { title: "더 맞는 제품" };

const GOAL_LABEL = { diet: "다이어트", muscle: "근육 증가" } as const;

/*
 * 3-4 더 맞는 제품(골라 비교). 들어오는 곳은 3-4 더 맞는 제품(전체)의 「제품 골라 비교하기 ›」뿐(디자인 메모 MVP 회의).
 * 지금 보는 제품 상자 + 더 맞는 제품 줄. 줄 왼쪽 동그라미로 비교함에 담고, 아래 비교함 바의 비교하기 → 3-5.
 * 뒤로 → 3-4 더 맞는 제품(전체)(흐름 점검 메모), 검색 → 2-3.
 * 데이터는 GET /products/{id}/alternatives(내 목표 기준, 첫 페이지 20개). 지금 제품 상자는 그 응답의 `current`로 그린다.
 * 응답에 100g · 100mL 기준이 없어 비교 기준 문장은 100g으로 쓴다(API 플랜 「API가 없는 값」).
 */
export default async function PickPage({
  params,
}: PageProps<"/product/[id]/better/pick">) {
  const { id } = await params;
  // 고른 적이 없으면 다이어트 기준이다(ONB_008)
  const goal = (await readServerDeviceGoal()) ?? "WEIGHT_LOSS";
  const page = await getAlternativesFirstPage(id, goal);
  if (!page) notFound();
  const { current } = page;
  const currentResult = current.goals?.[goal];
  const better = toBetterItems(page.items, SCREEN_GOAL[goal]);
  if (!currentResult || better.length === 0) redirect(`/product/${id}`);

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar
        title="더 맞는 제품"
        left={<BackButton fallbackHref={`/product/${id}/better`} />}
        right={
          <TopBarButton asChild aria-label="검색">
            <Link href="/search">
              <IconSearch />
            </Link>
          </TopBarButton>
        }
      />
      <PickList
        current={{
          id: current.id,
          name: current.name,
          image: current.imageUrl,
          brand: current.brandLine,
          score: toScore(currentResult.score),
          band: GRADE_BAND[currentResult.grade],
        }}
        items={better}
        basis={`${GOAL_LABEL[SCREEN_GOAL[goal]]} 목표로, 지금 제품과 100g당 값을 비교했어요`}
      />
    </div>
  );
}
