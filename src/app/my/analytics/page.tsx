import type { Metadata } from "next";

import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";

import { AnalyticsSetting } from "./analytics-setting";

export const metadata: Metadata = { title: "이용 통계" };

// 이용 통계(Google 애널리틱스) 끄기. 내 정보(5-1) 맨 아래 「이용 통계」 줄에서 들어오는 안쪽 화면이다 — 화면 번호·문구·
// 생김새는 디자인 확정 전 임시. 개인정보 처리방침 9-2항이 휴대폰에서 GA를 막는 방법으로 이 스위치를 안내하므로
// 로그인 없이 열려야 하고, 내 정보 화면이 생기기 전에는 처리방침의 바로 가기 주소로 들어온다
export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar title="이용 통계" left={<BackButton fallbackHref="/home" />} />
      <AnalyticsSetting />
    </div>
  );
}
