"use client";

import { useEffect } from "react";

import { readOptOut } from "@/lib/analytics/ga";
import { getPosthogKey, posthogConfig } from "@/lib/analytics/posthog";
import { useAnalyticsOptOut } from "@/lib/analytics/use-opt-out";

// 이 화면에서 PostHog 를 한 번이라도 켰는가. 켜기 전에 끈 사람은 라이브러리도 부르지 않는다
let started = false;

/*
 * PostHog(화면 기록 · 클릭)를 모든 화면에 붙인다. 「이용 통계 보내지 않기」 하나로 GA 와 함께 끈다.
 * 라이브러리는 키가 있고 보내도 될 때만 불러온다(첫 화면 무게를 늘리지 않게).
 * 이미 켠 뒤에 끄면 PostHog 공식 끄기(opt_out_capturing)로 바로 멈춘다 — GA 를 쓰는 화면은 어차피 새로 고쳐진다
 */
export function PosthogAnalytics() {
  const key = getPosthogKey();
  const optedOut = useAnalyticsOptOut(true);

  useEffect(() => {
    if (!key) return;
    const send = !optedOut && !readOptOut();
    if (!send && !started) return;

    let cancelled = false;
    void import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;
      if (!send) {
        posthog.opt_out_capturing();
        return;
      }
      if (!started) {
        posthog.init(key, posthogConfig());
        started = true;
      }
      // 예전에 끈 기록이 PostHog 저장소에 남아 있어도 지금 판단(이 사이트의 스위치)을 따른다
      if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing();
    });
    return () => {
      cancelled = true;
    };
  }, [key, optedOut]);

  return null;
}
