import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BackButton } from "@/components/common/back-button";
import { ProductCard } from "@/components/common/product-card";
import { SectionHeader } from "@/components/common/section-header";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";

import { FIXTURE_PRODUCTS } from "../_fixtures";

export const metadata: Metadata = { title: "더 맞는 제품" };

/*
 * 3-4 더 맞는 제품(전체). 지금 제품보다 점수가 높은 같은 종류 제품을 점수 높은 순 3열 사진 카드로(순위 숫자 없음).
 * 오는 곳: 3-2 「더 맞는 제품 · 전체 ›」, 기록의 「더 맞는 제품 n개 ›」, 3-2(생산 중단).
 * 디자인 메모: 카드 → 그 제품 3-2 · 「제품 골라 비교하기 ›」 → 3-4 더 맞는 제품(동그라미로 골라 비교) · ‹ → 이전.
 * 더 높은 제품이 없으면 이 화면 대신 3-2(더 맞는 제품이 없을 때)의 안내로 보낸다.
 * 데이터는 3-2와 같은 fixture(better). API 연결 때 GET /products/{id}/alternatives로 바꾼다.
 */
export default async function BetterPage({
  params,
}: PageProps<"/product/[id]/better">) {
  const { id } = await params;
  const product = FIXTURE_PRODUCTS[id];
  if (!product) notFound();
  if (product.better.length === 0) redirect(`/product/${id}`);

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar
        title="더 맞는 제품"
        left={<BackButton fallbackHref={`/product/${id}`} />}
        right={
          <TopBarButton asChild aria-label="검색">
            <Link href="/search">
              <IconSearch />
            </Link>
          </TopBarButton>
        }
      />
      <main className="pb-[calc(20px+var(--safe-bottom))]">
        <SectionHeader
          title="같은 종류에서 점수가 더 높아요"
          description={`${product.name}(${product.score}점)보다 점수가 높아요`}
        />
        <div className="flex justify-end px-5 pb-2">
          <Link
            href={`/product/${id}/better/pick`}
            className="text-body2-bold text-accent-blue-text"
          >
            제품 골라 비교하기 <span aria-hidden>›</span>
          </Link>
        </div>
        <ul className="grid grid-cols-3 gap-x-2.5 gap-y-5 px-5 pt-1">
          {product.better.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} fluid />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
