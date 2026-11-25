import type { Metadata } from "next";

import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";
import { DeviceDeleteRow } from "@/components/device-delete/device-delete-sheet";
import { PolicyHeader, PolicySections } from "@/components/policy/policy-doc";

import {
  DELETE_REQUEST_EMAIL,
  FIXTURE_DEVICE_ID,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_SECTIONS,
} from "./_fixtures";

export const metadata: Metadata = { title: "개인정보 처리방침" };

/*
 * 5-10 개인정보 처리방침(【최종】). 5-5 설정의 「개인정보 처리방침」, 5-6 가입 동의의 「보기」, 5-11 이용 통계의 「개인정보 처리방침 보기 ›」에서 온다.
 * 목차 13줄을 그 자리에서 펼치고, 맨 아래 「이 기기의 기록 삭제 요청」은 5-10b 시트를 이 화면 위에 띄운다. 뒤로(‹)는 이전 화면
 */
export default async function Page({ searchParams }: PageProps<"/privacy">) {
  // 미리보기: ?sheet=device-delete — 5-10b 시트를 연 채로. 이 값 하나만 받는다
  const { sheet } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-safe">
      <TopBar
        title="개인정보 처리방침"
        left={<BackButton fallbackHref="/settings" />}
      />
      <main className="flex flex-col pb-2.5">
        <PolicyHeader
          title="마이뉴티 개인정보 처리방침"
          effectiveDate={PRIVACY_EFFECTIVE_DATE}
          compact
        />
        <PolicySections
          sections={PRIVACY_SECTIONS}
          compact
          lastDivider={false}
        />
        <div aria-hidden className="h-2 bg-bg-band" />
        <DeviceDeleteRow
          title="이 기기의 기록 삭제 요청"
          className="py-3"
          initialOpen={sheet === "device-delete"}
          deviceId={FIXTURE_DEVICE_ID}
          email={DELETE_REQUEST_EMAIL}
        />
      </main>
    </div>
  );
}
