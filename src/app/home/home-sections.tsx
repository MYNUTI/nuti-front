import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/common/button";
import { CategoryTile } from "@/components/common/category-tile";
import { ScoreRing } from "@/components/common/score-ring";
import { SectionHeader } from "@/components/common/section-header";
import { cn } from "@/lib/utils";

import type { Goal, PopularProduct } from "./_fixtures";

/*
 * 2-1 홈의 칸들. 피그마 2-1 홈(첫 방문)과 11-04 회의 반영 메모를 따른다.
 * 이동할 화면이 아직 없는 링크는 플랜 라우트 표의 경로만 걸어 둔다.
 */

const GOAL_CARD = {
  diet: {
    title: "다이어트 목표로 보고 있어요",
    image: { src: "/home/goal-diet.png", width: 1446, height: 1087 },
    // 피그마: 200×150, 왼쪽 203·위 29, 꽉 채움
    imageClass: "top-[29px] left-[203px] h-[150px] w-[200px] object-cover",
  },
  muscle: {
    title: "근육 증가 목표로 보고 있어요",
    image: { src: "/home/goal-muscle.png", width: 1358, height: 1159 },
    // 피그마: 248×192, 왼쪽 175·위 0에서 그림을 6.29% 내려 놓음
    imageClass:
      "top-[12px] left-[175px] h-[192px] w-[248px] object-cover object-top",
  },
} as const;

/** 내 목표 카드(빈 상태). 최근 본 제품이 없을 때 */
export function GoalCardEmpty({ goal }: { goal: Goal }) {
  const card = GOAL_CARD[goal];

  return (
    <div className="px-4 pt-1 pb-4">
      <div className="relative h-[205px] overflow-hidden rounded-lg bg-gradient-to-r from-[rgba(229,245,254,0.6)] to-[rgba(205,223,254,0.6)]">
        <Image
          src={card.image.src}
          width={card.image.width}
          height={card.image.height}
          sizes="248px"
          alt=""
          loading="eager"
          fetchPriority="high"
          className={cn("absolute max-w-none opacity-90", card.imageClass)}
        />
        <div className="absolute top-[18px] left-[18px] flex flex-col items-start">
          {/* 피그마는 「›」만 있고 갈 곳이 메모에 없다. 목표를 바꾸는 5-2로 걸어 둔다 */}
          <Link
            href="/my/goal"
            className="text-[15px] leading-[22px] font-bold text-text-strong"
          >
            {card.title} ›
          </Link>
          <p className="mt-3.5 text-[14px] leading-5 font-medium text-text-strong">
            최근 본 제품이 아직 없어요
          </p>
          <p className="mt-1 text-[12px] leading-[18px] text-text-body">
            바코드를 찍으면 등급과 함께
            <br />
            여기에 기록이 쌓여요.
          </p>
          <Link
            href="/scan"
            className="mt-4 rounded-full bg-bg-page px-3.5 py-2 text-[13px] leading-[18px] font-bold text-brand-link"
          >
            바코드 찍어 보기
          </Link>
        </div>
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
      {/* 피그마 메모: 「전체 15」 → 2-3 검색(어디로 갈지 안 정함, SRCH_006) */}
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
      <div className="flex gap-2.5 overflow-x-auto px-5 pt-1 pb-6">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="flex w-[114px] shrink-0 flex-col gap-1.5"
          >
            <Image
              src={p.image}
              width={p.imageSize}
              height={p.imageSize}
              sizes="114px"
              alt=""
              className="size-[114px] rounded-sm border border-line-default bg-white object-contain"
            />
            <span className="flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-[12px] leading-4 text-text-sub">
                {p.brand}
              </span>
              {/* 피그마는 S(32) 링을 30으로 줄여 놓았다. 부품 크기 S를 그대로 쓴다 */}
              <ScoreRing score={p.score} band={p.band} size="S" />
            </span>
            <span className="line-clamp-2 h-9 text-[13px] leading-[18px] font-medium break-keep text-text-strong">
              {p.name}
            </span>
            <span className="flex h-11 flex-wrap content-start gap-1 overflow-hidden">
              {p.tags.map((t) => (
                <span
                  key={t.label}
                  className={cn(
                    "rounded-[4px] px-1.5 py-0.5 text-[11px] leading-4",
                    t.warn
                      ? "bg-accent-pink-weak text-accent-pink-text"
                      : "bg-bg-band text-text-body",
                  )}
                >
                  {t.label}
                </span>
              ))}
            </span>
          </Link>
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
        <div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-6">
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
          className="pointer-events-none absolute top-4 right-0 h-9 w-10 bg-gradient-to-r from-white/0 to-white"
        />
      </div>
    </section>
  );
}

export function RequestSection() {
  return (
    // 11-04 회의: 연한 민트 바탕(모든 화면 같음). 피그마 변수 없이 직접 넣은 색
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
