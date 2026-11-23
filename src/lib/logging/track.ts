import { api } from "@/lib/api/client";
import {
  postCtaLog,
  postEvents,
  postFilterLog,
  postScanEventLog,
  postSearchLog,
  postViewLog,
} from "@/lib/logging/api";
import { toScanEventBody } from "@/lib/logging/mapper";
import type {
  AppEventName,
  FilterLogDto,
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

export function logScanEvent(input: ScanEventInput) {
  send(() => postScanEventLog(api, toScanEventBody(input)));
}

/**
 * v3 앱 이벤트 하나를 보낸다. 시각은 기기 시각(ISO-8601)이고 세션 ID는 요청 헤더로 간다. 속성에 몸 정보를
 * 넣지 않는다(서버도 지운다)
 */
export function logEvent(
  name: AppEventName,
  { screen, props }: { screen?: string; props?: Record<string, unknown> } = {},
) {
  send(() =>
    postEvents(api, {
      events: [{ name, screen, occurredAt: new Date().toISOString(), props }],
    }),
  );
}
