"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";

import {
  getMeasurementId,
  hasStartedAnalytics,
  isOptOutSaved,
  readOptOut,
  trackPageView,
} from "@/lib/analytics/ga";
import { useAnalyticsOptOut } from "@/lib/analytics/use-opt-out";

/*
 * Google 애널리틱스를 모든 화면에 붙인다. 화면 이동은 주소의 경로가 바뀔 때만 센다(「?」 뒤만 바뀌는
 * 시트·미리보기 열기는 같은 화면). 측정 ID가 없거나 「이용 통계 보내지 않기」를 켰으면 gtag.js도 부르지 않는다
 */
export function GoogleAnalytics() {
  const id = getMeasurementId();
  const optedOut = useAnalyticsOptOut(true);
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (!id || optedOut || readOptOut()) return;
    previous.current = trackPageView(id, previous.current);
  }, [id, optedOut, pathname]);

  // 이미 불러온 gtag.js는 끄기 값을 나중에 세워도 자동 이벤트를 계속 보낸다. 이 탭이든 다른 탭이든 끄면,
  // GA를 시작한 탭은 보이는 동안 새로 고쳐 처음부터 부르지 않게 한다. 저장에 실패했으면 새로 고치면 끈 것이
  // 사라지므로 그대로 둔다
  useEffect(() => {
    if (!optedOut || !hasStartedAnalytics() || !isOptOutSaved()) return;
    const reloadWhenVisible = () => {
      if (document.visibilityState === "visible") window.location.reload();
    };
    reloadWhenVisible();
    document.addEventListener("visibilitychange", reloadWhenVisible);
    return () =>
      document.removeEventListener("visibilitychange", reloadWhenVisible);
  }, [optedOut]);

  if (!id || optedOut) return null;
  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      strategy="afterInteractive"
    />
  );
}
