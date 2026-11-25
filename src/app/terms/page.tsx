import type { Metadata } from "next";

import { BackButton } from "@/components/common/back-button";
import { TopBar } from "@/components/common/top-bar";
import { PolicyHeader, PolicySections } from "@/components/policy/policy-doc";

import { TERMS_EFFECTIVE_DATE, TERMS_SECTIONS } from "./_fixtures";

export const metadata: Metadata = { title: "이용약관" };

/*
 * 5-9 이용약관(【최종】). 5-5 설정의 「이용약관」, 5-6 가입 동의의 「보기」에서 온다.
 * 읽기만 하는 화면이고 조항 줄을 누르면 그 자리에서 펼쳐진다. 뒤로(‹)는 이전 화면
 */
export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-safe">
      <TopBar title="이용약관" left={<BackButton fallbackHref="/settings" />} />
      <main className="flex flex-col pb-[75px]">
        <PolicyHeader
          title="마이뉴티 이용약관"
          effectiveDate={TERMS_EFFECTIVE_DATE}
        />
        <PolicySections sections={TERMS_SECTIONS} />
      </main>
    </div>
  );
}
