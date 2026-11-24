import type { Metadata } from "next";
import Link from "next/link";

import { BackButton } from "@/components/common/back-button";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";

import { CompareTable } from "./compare-table";

export const metadata: Metadata = { title: "제품 비교" };

/*
 * 3-5 제품 비교. 오는 곳: 비교함 바 「비교하기」(3-2 · 3-4), 홈 「비교하기」, 스캔 시트 비교함 줄.
 * 비교함은 브라우저 저장소라 표는 클라이언트에서 그린다. 뒤로 → 이전 화면, 검색 → 2-3.
 */
export default function ComparePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-safe">
      <TopBar
        title="제품 비교"
        left={<BackButton fallbackHref="/home" />}
        right={
          <TopBarButton asChild aria-label="검색">
            <Link href="/search">
              <IconSearch />
            </Link>
          </TopBarButton>
        }
      />
      <CompareTable />
    </div>
  );
}
