import Link from "next/link";

import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";
import { cn } from "@/lib/utils";

export type HistoryTab = "recent" | "saved" | "requests";

const TABS: { tab: HistoryTab; label: string; href: string }[] = [
  { tab: "recent", label: "최근 본 제품", href: "/history" },
  { tab: "saved", label: "즐겨찾기", href: "/history?tab=saved" },
  { tab: "requests", label: "분석 요청", href: "/history?tab=requests" },
];

/* 4-1 · 4-3 · 4-4 위 줄 「기록」 + 검색, 탭 3칸(최근 본 제품 · 즐겨찾기 · 분석 요청). 탭은 주소(`?tab=`)로 바꾼다 */
export function HistoryHeader({ tab }: { tab: HistoryTab }) {
  return (
    <>
      <TopBar
        root
        title="기록"
        right={
          <TopBarButton asChild aria-label="검색">
            <Link href="/search">
              <IconSearch />
            </Link>
          </TopBarButton>
        }
      />
      <nav aria-label="기록" className="flex border-b border-line-default">
        {TABS.map((t) => {
          const current = t.tab === tab;
          return (
            <Link
              key={t.tab}
              href={t.href}
              replace
              scroll={false}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex h-12 flex-1 items-center justify-center",
                current
                  ? "-mb-px border-b-2 border-text-strong text-body1-bold text-text-strong"
                  : "text-body1-medium text-text-sub",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
