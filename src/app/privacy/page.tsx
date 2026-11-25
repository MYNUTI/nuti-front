import type { Metadata } from "next";

import { BackButton } from "@/components/common/back-button";
import { ListRow } from "@/components/common/list-row";
import { TopBar } from "@/components/common/top-bar";
import { PolicyHeader, PolicySections } from "@/components/policy/policy-doc";

import { PRIVACY_EFFECTIVE_DATE, PRIVACY_SECTIONS } from "./_fixtures";

export const metadata: Metadata = { title: "개인정보 처리방침" };

/*
 * 5-10 개인정보 처리방침(【최종】). 5-5 설정의 「개인정보 처리방침」, 5-6 가입 동의의 「보기」에서 온다.
 * 목차 13줄을 그 자리에서 펼치고, 맨 아래 「이 기기의 기록 삭제 요청」은 5-10b 시트를 이 화면 위에 띄운다. 뒤로(‹)는 이전 화면
 */
export default function Page() {
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
        {/* 5-10b는 처리방침 위에 뜨는 시트다. 시트는 5-10b 작업 때 이 주소 값으로 띄운다 */}
        <ListRow
          title="이 기기의 기록 삭제 요청"
          href="/privacy?sheet=device-delete"
          className="py-3"
        />
      </main>
    </div>
  );
}
