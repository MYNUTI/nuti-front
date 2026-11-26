import Image from "next/image";
import Link from "next/link";

import { GoalLink } from "@/app/my/goal/goal-link";
import { MAJOR_ICON } from "@/app/ranking/format";
import { Button } from "@/components/common/button";
import { CategoryTile } from "@/components/common/category-tile";
import { ProductCard } from "@/components/common/product-card";
import { SearchFieldLink } from "@/components/common/search-field";
import { SectionHeader } from "@/components/common/section-header";
import { TopBarButton } from "@/components/common/top-bar";
import { IconBarcode } from "@/components/icons";

import type { Goal, PopularProduct } from "./_fixtures";

/*
 * 2-1 홈의 칸들. 【최종】 2-1 홈(첫 방문 · 사용 중 · 담아 둔 비교함이 있을 때)과 메모를 따른다.
 * 이동할 화면이 아직 없는 링크는 플랜 라우트 표의 경로만 걸어 둔다.
 */

/** 맨 위: 검색칸 + 바코드 버튼, 그 아래 「AI 영양 진단」 배너(늘 보임) */
export function SearchSection() {
  return (
    <div className="flex flex-col pt-2 pb-[11px]">
      <div className="flex items-center gap-1 pr-2 pl-5">
        <SearchFieldLink
          href="/search"
          placeholder="제품, 브랜드, 종류로 검색"
          data-guide="search"
          className="min-w-0 flex-1"
        />
        {/* 【최종】 메모: 권한 전이면 0-3, 허용했으면 3-1. 나누는 일은 /scan이 한다 */}
        <TopBarButton asChild aria-label="바코드 찍기">
          <Link href="/scan">
            <IconBarcode />
          </Link>
        </TopBarButton>
      </div>
      {/* 【최종】: 조건 없이 늘 보인다. 누르면 5-7 내 몸에 맞추기 */}
      <Link href="/my/body" className="mt-[15px] block">
        <Image
          src="/home/ai-banner.png"
          width={1206}
          height={273}
          // 첫 화면 맨 위 그림이라 먼저 받는다
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 420px) 100vw, 420px"
          alt="AI 영양 진단까지 하면 추천이 더 정교해져요"
          className="h-auto w-full"
        />
      </Link>
    </div>
  );
}

/*
 * 대분류 15개 중 앞 10개(10-29 확정). 누르면 그 대분류 전체 순위(2-2, 메모 「오는 곳: 홈의 대분류 타일」).
 * 그림은 【최종】 일러스트(그림 한 장을 칸마다 잘라 씀)로 2-5f 식품 분류와 같은 표(`MAJOR_ICON`)를 쓴다
 */
const CATEGORIES = [
  { code: "01", label: "다이어트·\n단백질" },
  { code: "02", label: "간편식" },
  { code: "03", label: "음료" },
  { code: "04", label: "빵·케이크·잼" },
  { code: "05", label: "과자·\n초콜릿·떡" },
  { code: "06", label: "라면·면" },
  { code: "07", label: "고기·햄·달걀" },
  { code: "08", label: "유제품·\n아이스크림" },
  { code: "09", label: "수산물·\n건어물" },
  { code: "10", label: "쌀·잡곡·견과" },
];

export function CategorySection() {
  return (
    <section id="home-category" aria-labelledby="home-category-title">
      {/* 【최종】은 보이는 제목이 없다. 화면 읽기의 제목 이동에서 이 구역을 건너뛰지 않게 숨은 제목을 둔다 */}
      <h2 id="home-category-title" className="sr-only">
        종류
      </h2>
      {/* 【최종】: 칸 74 · 줄 간격 104(칸 94 + 10) */}
      <div className="grid grid-cols-5 gap-y-2.5 px-4 pt-3 pb-3">
        {CATEGORIES.map((c) => (
          <CategoryTile
            key={c.code}
            href={`/ranking/${c.code}`}
            size="S"
            label={c.label}
            className="h-[94px] w-full min-w-0"
            image={
              <Image
                src={`/home/category/${MAJOR_ICON[c.code]}.png`}
                width={168}
                height={168}
                sizes="56px"
                alt=""
              />
            }
          />
        ))}
      </div>
      {/* 【최종】 메모: 2-5f 식품 분류 시트(대분류 15줄 접힌 채) */}
      <div className="flex justify-center">
        <Link
          href="/ranking?sheet=category"
          className="flex h-11 items-center px-4 text-[13px] font-medium text-brand-link"
        >
          종류 전체 보기<span aria-hidden>&nbsp;›</span>
        </Link>
      </div>
    </section>
  );
}

export function PopularSection({
  goal,
  products,
}: {
  goal: Goal;
  products: PopularProduct[];
}) {
  return (
    <section>
      {/* 【최종】 메모(안 정함): 순서와 제목은 인기 자료가 생기면 다시 정한다. 지금은 서버가 주는 임시 순서 */}
      <SectionHeader
        title="쿠팡에서 살 수 있는 제품"
        actionLabel="전체"
        actionHref="/ranking?seller=COUPANG"
        description={
          // 【최종】 메모: 목표 → 5-2 목표 바꾸기
          <GoalLink
            fallback={goal}
            className="text-[12px] leading-5 font-medium text-brand-link"
          />
        }
      />
      <div className="flex gap-2.5 overflow-x-auto px-5 pt-1 pb-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

// code는 순위 화면 주소 `?seller=`의 값(API `Seller`)
const SELLERS = [
  { slug: "coupang", code: "COUPANG", name: "쿠팡" },
  { slug: "cu", code: "CU", name: "CU" },
  { slug: "gs25", code: "GS25", name: "GS25" },
  { slug: "seven-eleven", code: "SEVEN_ELEVEN", name: "세븐일레븐" },
  { slug: "emart24", code: "EMART24", name: "이마트24" },
  { slug: "oliveyoung", code: "OLIVE_YOUNG", name: "올리브영" },
  { slug: "kurly", code: "KURLY", name: "컬리" },
];

export function SellerSection() {
  return (
    <section>
      <SectionHeader title="판매처별로 보기" />
      <div className="relative">
        {/* v3/SellerTile: 흰 칸 80 · 테두리 · 모서리 8, 로고 60×36. 누르면 그 판매처 필터를 켠 대분류 전체 순위(11-09) */}
        <div className="flex gap-2.5 overflow-x-auto px-5 pt-2 pb-5">
          {SELLERS.map((s) => (
            <Link
              key={s.slug}
              href={`/ranking?seller=${s.code}`}
              className="flex w-20 shrink-0 flex-col items-center gap-1.5"
            >
              <span className="flex size-20 items-center justify-center rounded-sm border border-line-default bg-bg-page">
                <Image
                  src={`/home/seller/${s.slug}.png`}
                  width={240}
                  height={144}
                  sizes="60px"
                  alt=""
                  className="h-9 w-15 object-contain"
                />
              </span>
              <span className="text-caption text-text-body">{s.name}</span>
            </Link>
          ))}
        </div>
        {/* 11-04 회의: 오른쪽 끝을 흐리게 해 옆으로 넘길 수 있음을 보인다(로고 칸과 이름까지) */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 right-0 h-[102px] w-10 bg-gradient-to-r from-white/0 to-white"
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
          이름을 알려 주면 점수를 매길 순서에 넣어요.
        </p>
      </div>
      <Button kind="text" size="M" asChild>
        <Link href="/contribute/request">제품 요청하기</Link>
      </Button>
    </section>
  );
}
