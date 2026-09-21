import type { Metadata } from "next";
import Link from "next/link";
import { GradeBadge } from "@/components/common/grade";
import { TabBar } from "@/components/common/tab-bar";
import { findProductById } from "@/lib/product";

/** TODO: 실제 열람 기록이 생기면 서버에서 받는다. 카탈로그 전체와 같지 않다. */
const RECENT_IDS = ["1", "2"];

/** TODO: 목표 설정(1-5) 상태가 생기면 사용자의 현재 목표로 바꾼다. */
const GRADE_BASIS = "체중 감량 기준";

const RECENT = RECENT_IDS.map(findProductById).filter(
  (product) => product !== undefined,
);

export const metadata: Metadata = {
  title: "홈",
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-32">
        <h1 className="text-2xl font-bold">오늘도 확인해 볼까요</h1>

        <input
          type="search"
          placeholder="제품명·브랜드 검색"
          className="mt-5 h-14 rounded-2xl border border-border bg-card px-4 text-[15px] placeholder:text-muted-foreground"
        />

        <button
          type="button"
          className="mt-2.5 flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 text-left"
        >
          <span className="text-[15px] font-bold">
            복사한 상품 링크 붙여넣기
          </span>
          <span className="text-[13px] text-muted-foreground">
            쿠팡·컬리 링크를 붙여넣으면 제품을 찾아드려요
          </span>
        </button>

        <h2 className="mt-7 text-[15px] font-bold">최근 본 제품</h2>

        <ul className="mt-3 flex flex-col gap-2.5">
          {RECENT.map(({ id, name, grade }) => (
            <li key={id}>
              <Link
                href={`/product/${id}`}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5"
              >
                <span className="size-14 shrink-0 rounded-xl bg-muted" />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{name}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {GRADE_BASIS}
                  </span>
                </span>
                <GradeBadge grade={grade} />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <TabBar />
    </main>
  );
}
