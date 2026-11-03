import { api } from "@/lib/api/client";
import {
  postCtaLog,
  postFilterLog,
  postImpressionLog,
  postOnboardingStepLog,
  postScanEventLog,
  postSearchLog,
  postViewLog,
} from "@/lib/logging/api";
import { toImpressionBody, toScanEventBody } from "@/lib/logging/mapper";
import type {
  FilterLogDto,
  ImpressionInput,
  OnboardingStepLogDto,
  ScanEventInput,
  SearchLogDto,
} from "@/lib/logging/types";

/**
 * 개발 중에도 배포 서버(운영 데이터)를 쓰는데, 서버가 개발 트래픽을 구분하지 못해 검색어가 사용자에게
 * 보이는 인기 검색어와 운영 통계에 섞인다. 그래서 `NEXT_PUBLIC_LOGGING_ENABLED`로 켜고 끄고, 비워 두면
 * 프로덕션 빌드만 보낸다
 */
export function isLoggingEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_LOGGING_ENABLED;
  if (flag) return flag === "true";
  return process.env.NODE_ENV === "production";
}

// 로그는 화면 흐름을 막지 않아야 해서 응답을 기다리지 않고 실패도 버린다. TanStack 변경 훅을 쓰지 않는
// 이유도 같다 — 실패가 공통 에러 알림으로 가면 안 된다
function send(request: () => Promise<unknown>) {
  if (!isLoggingEnabled()) return;
  request().catch(() => undefined);
}

export function logProductView(productId: string) {
  send(() => postViewLog(api, { productId: Number(productId) }));
}

export function logProductCta(productId: string) {
  send(() => postCtaLog(api, { productId: Number(productId) }));
}

export function logSearch(body: SearchLogDto) {
  send(() => postSearchLog(api, body));
}

export function logFilter(body: FilterLogDto) {
  send(() => postFilterLog(api, body));
}

export function logImpressions(input: ImpressionInput) {
  // 서버도 빈 목록은 저장하지 않고 200으로 넘긴다
  if (input.items.length === 0) return;
  send(() => postImpressionLog(api, toImpressionBody(input)));
}

export function logScanEvent(input: ScanEventInput) {
  send(() => postScanEventLog(api, toScanEventBody(input)));
}

export function logOnboardingStep(body: OnboardingStepLogDto) {
  send(() => postOnboardingStepLog(api, body));
}
