import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BackButton } from "@/components/common/back-button";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";

import { FIXTURE_PRODUCTS } from "../../_fixtures";
import { PickList } from "./pick-list";

export const metadata: Metadata = { title: "더 맞는 제품" };

const GOAL_LABEL = { diet: "다이어트", muscle: "근육 증가" } as const;

/*
 * 3-4 더 맞는 제품(골라 비교). 들어오는 곳은 3-4 더 맞는 제품(전체)의 「제품 골라 비교하기 ›」뿐(디자인 메모 MVP 회의).
 * 지금 보는 제품 상자 + 더 맞는 제품 줄. 줄 왼쪽 동그라미로 비교함에 담고, 아래 비교함 바의 비교하기 → 3-5.
 * 뒤로 → 3-4 더 맞는 제품(전체)(흐름 점검 메모), 검색 → 2-3.
 * 데이터는 3-2와 같은 fixture(better · diff). API 연결 때 GET /products/{id}/alternatives로 바꾼다.
 */
export default async function PickPage({
  params,
}: PageProps<"/product/[id]/better/pick">) {
  const { id } = await params;
  const product = FIXTURE_PRODUCTS[id];
  if (!product) notFound();
  if (product.better.length === 0) redirect(`/product/${id}`);

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
          id: product.id,
          name: product.name,
          image: product.image?.src ?? null,
          brand: product.brand,
          score: product.score,
          band: product.band,
        }}
        items={product.better}
        basis={`${GOAL_LABEL[product.goal]} 목표로, 지금 제품과 100${product.nutrition.unit}당 값을 비교했어요`}
      />
    </div>
  );
}
