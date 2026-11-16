"use client";

import { useState } from "react";

import { ListRow } from "@/components/common/list-row";
import { Toast } from "@/components/common/toast";
import { writeOptOut } from "@/lib/analytics/ga";
import {
  useAnalyticsOptOut,
  useOptOutStorageReadable,
} from "@/lib/analytics/use-opt-out";
import { usePolicies } from "@/lib/me/queries";

// 5-11 이용 통계. 문구는 디자인 확정본(11-16 · 기능명세서 ACCT_011)
export function AnalyticsSetting() {
  const optedOut = useAnalyticsOptOut(false);
  const readable = useOptOutStorageReadable();
  // 저장 실패 알림을 다시 띄우려면 Toast를 새로 마운트해야 해서(key) 횟수로 센다
  const [saveFailures, setSaveFailures] = useState(0);
  const { data: policies } = usePolicies();
  const privacyUrl = policies?.privacy?.url;

  return (
    <div className="flex flex-col pb-10">
      <p className="px-5 pt-2 pb-6 text-body1 break-keep text-text-sub">
        어느 화면에서 이용을 멈추는지 알고 고치려고, 열어 본 화면과 머문 시간
        같은 이용 통계를 Google 애널리틱스로 보내요. 이름, 이메일, 고른 목표는
        보내지 않아요.
      </p>
      <ListRow
        title="이용 통계 보내지 않기"
        description={optedOut ? "지금은 보내지 않아요" : "지금은 보내고 있어요"}
        className={readable ? undefined : "cursor-not-allowed"}
        toggle={{
          checked: optedOut,
          // 저장소를 못 읽는 브라우저는 보내지 않음으로 고정한다(켬 값을 기억할 수 없어서 · ACCT_011 예외)
          disabled: !readable,
          className: readable ? undefined : "opacity-40",
          // 켜면 GA를 이미 시작한 화면은 새로 고쳐진다(app/google-analytics.tsx). 저장에 실패하면 스위치 · GA는
          // 그대로 두고 알림만 띄운다(ACCT_011 마지막 시나리오)
          onChange: (event) => {
            if (!writeOptOut(event.target.checked))
              setSaveFailures((count) => count + 1);
          },
        }}
      />
      {saveFailures > 0 && (
        <Toast
          key={saveFailures}
          message="저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요."
          // 이 화면에는 하단 탭이 없어 화면 아래쪽에 띄운다
          className="bottom-[calc(24px+var(--safe-bottom))]"
        />
      )}
      <p className="px-5 pt-4 text-body2 break-keep text-text-sub">
        이 브라우저에만 적용돼요. 다른 브라우저나 기기로 열거나 쿠키와 사이트
        데이터를 지우면 {"'이용 통계 보내지 않기'"}를 다시 켜 주세요. 보내지
        않아도 모든 기능을 그대로 쓸 수 있어요.
      </p>
      {/* 디자인 확정본은 앱 안 5-10 처리방침 화면으로 간다. 그 화면이 생기기 전까지 바깥 주소 */}
      {privacyUrl && (
        <a
          href={privacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 pt-6 text-body2 text-text-sub underline"
        >
          개인정보 처리방침 보기
        </a>
      )}
    </div>
  );
}
