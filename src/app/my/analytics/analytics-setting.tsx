"use client";

import { ListRow } from "@/components/common/list-row";
import { writeOptOut } from "@/lib/analytics/ga";
import { useAnalyticsOptOut } from "@/lib/analytics/use-opt-out";
import { usePolicies } from "@/lib/me/queries";

export function AnalyticsSetting() {
  const optedOut = useAnalyticsOptOut(false);
  const { data: policies } = usePolicies();
  const privacyUrl = policies?.privacy?.url;

  return (
    <div className="flex flex-col pb-10">
      <p className="px-5 pt-2 pb-6 text-body1 break-keep text-text-sub">
        어느 화면에서 이용이 끊기는지 알고 고치려고, 본 화면과 머문 시간 같은
        이용 기록을 Google 애널리틱스로 보내요. 이름, 이메일, 고른 목표는 보내지
        않아요.
      </p>
      <ListRow
        title="이용 통계 보내지 않기"
        description="이 브라우저에서만 적용돼요"
        toggle={{
          checked: optedOut,
          // 켜면 GA를 이미 시작한 화면은 새로 고쳐진다(app/google-analytics.tsx)
          onChange: (event) => writeOptOut(event.target.checked),
        }}
      />
      <p className="px-5 pt-4 text-body2 break-keep text-text-sub">
        보내지 않아도 모든 기능을 그대로 쓸 수 있어요. 다른 브라우저로 열거나
        브라우저 데이터를 지우면 다시 켜 주세요.
      </p>
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
