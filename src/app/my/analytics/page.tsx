import type { Metadata } from "next";
import Link from "next/link";

import { BackButton } from "@/components/common/back-button";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";

import { AnalyticsSetting } from "./analytics-setting";

export const metadata: Metadata = { title: "이용 통계" };

// 5-11 이용 통계(【최종】). 내 정보(5-1, 로그인 전 · 후 모두) 맨 아래 「이용 통계」 줄에서 들어온다. 뒤로(‹)는 5-1.
// 개인정보 처리방침이 휴대폰에서 GA · PostHog를 막는 방법으로 이 스위치를 안내하므로 로그인 없이 열려야 한다.
// 줄 이름 · 스위치 이름 · 자리는 처리방침에 그대로 적혀 있어, 바꾸면 처리방침도 같이 고친다(메모)
export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar
        title="이용 통계"
        left={<BackButton fallbackHref="/my" />}
        right={
          <TopBarButton asChild aria-label="검색">
            <Link href="/search">
              <IconSearch />
            </Link>
          </TopBarButton>
        }
      />
      <AnalyticsSetting />
    </div>
  );
}
