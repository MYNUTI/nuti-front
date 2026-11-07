import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/common/button";
import { CategoryTile } from "@/components/common/category-tile";
import { ProductCard } from "@/components/common/product-card";
import { SectionHeader } from "@/components/common/section-header";

import type { CompareLeft, PopularProduct } from "./_fixtures";

/*
 * 2-1 홈의 칸들. 디자인 2-1 홈(첫 방문)과 11-04 회의 반영 메모를 따른다.
 * 이동할 화면이 아직 없는 링크는 플랜 라우트 표의 경로만 걸어 둔다.
 */

/*
 * 비교함 남음 안내. 비교함에 담은 지 24시간이 지난 뒤 앱을 다시 열 때 한 번만 보인다.
 * 한 번 보였는지는 API 연결 때 정한다.
 */
export function CompareBanner({ left }: { left: CompareLeft }) {
  return (
    <div className="px-5 pb-3">
      <div className="flex items-start gap-2 rounded-md bg-bg-field py-3 pr-3 pl-4">
        <p className="text-body2-medium text-text-strong">
          {left.addedLabel} 담은 {left.count}개가 비교함에 남아 있어요
        </p>
        {/* 보이는 높이는 디자인대로 20, 누르는 영역은 위아래로 넓혀 36 */}
        <Button
          asChild
          kind="secondary"
          size="S"
          className="relative h-5 shrink-0 after:absolute after:inset-x-0 after:-inset-y-2"
        >
          <Link href="/compare">비교하기</Link>
        </Button>
      </div>
    </div>
  );
}

/* 대분류 15개 중 앞 10개(10-29 확정). 그림은 10-29 받은 실사 사진 */
const CATEGORIES = [
  { slug: "diet-protein", label: "다이어트·\n단백질" },
  { slug: "ready-meal", label: "간편식" },
  { slug: "drink", label: "음료" },
  { slug: "bakery", label: "빵·케이크·\n잼" },
  { slug: "snack", label: "과자·\n초콜릿·떡" },
  { slug: "noodle", label: "라면·면" },
  { slug: "meat", label: "고기·햄·\n달걀" },
  { slug: "dairy", label: "유제품·\n아이스크림" },
  { slug: "seafood", label: "수산물·\n건어물" },
  { slug: "grain", label: "쌀·잡곡·\n견과" },
];

export function CategorySection() {
  return (
    <section>
      {/* 디자인 메모: 「전체 15」 → 2-3 검색(어디로 갈지 안 정함, SRCH_006) */}
      <SectionHeader
        title="카테고리로 찾기"
        actionLabel="전체 15"
        actionHref="/search"
      />
      <div className="grid grid-cols-5 gap-y-4 px-5 pt-2 pb-6">
        {CATEGORIES.map((c) => (
          <CategoryTile
            key={c.slug}
            href={`/ranking?category=${c.slug}`}
            size="S"
            label={c.label}
            className="w-full min-w-0"
            image={
              <Image
                src={`/home/category/${c.slug}.png`}
                width={240}
                height={240}
                sizes="64px"
                alt=""
              />
            }
          />
        ))}
      </div>
    </section>
  );
}

export function PopularSection({ products }: { products: PopularProduct[] }) {
  return (
    <section>
      <SectionHeader
        title="편의점 인기 상품"
        actionLabel="전체"
        actionHref="/ranking"
      />
      <div className="flex gap-2.5 overflow-x-auto px-5 pt-1 pb-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

const SELLERS = [
  "쿠팡",
  "CU",
  "GS25",
  "세븐일레븐",
  "이마트24",
  "올리브영",
  "컬리",
];

export function SellerSection() {
  return (
    <section>
      <SectionHeader title="판매처별로 보기" />
      <div className="relative">
        {/* 11-04 회의: 누르면 그 판매처 필터를 켠 대분류 전체 순위 */}
        <div className="flex gap-2 overflow-x-auto px-5 pt-2 pb-5">
          {SELLERS.map((s) => (
            <Link
              key={s}
              href={`/ranking?seller=${encodeURIComponent(s)}`}
              className="flex h-9 shrink-0 items-center rounded-full border border-line-strong bg-bg-page px-3.5 text-body2-medium text-text-strong"
            >
              {s}
            </Link>
          ))}
        </div>
        {/* 11-04 회의: 오른쪽 끝을 흐리게 해 옆으로 넘길 수 있음을 보인다 */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 right-0 h-9 w-10 bg-gradient-to-r from-white/0 to-white"
        />
      </div>
    </section>
  );
}

export function RequestSection() {
  return (
    // 11-04 회의: 연한 민트 바탕(모든 화면 같음). 디자인 변수 없이 직접 넣은 색
    <section className="flex items-center gap-2 bg-[#f3fcfb] pt-5 pr-3 pb-7 pl-5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="text-body1-bold text-text-strong">
          찾는 제품이 없나요?
        </h2>
        <p className="text-body2 text-text-sub">
          제품을 알려 주시면 분석 요청 목록에 올려요.
        </p>
      </div>
      <Button kind="text" size="M" asChild>
        <Link href="/contribute/name">제품 요청하기</Link>
      </Button>
    </section>
  );
}
