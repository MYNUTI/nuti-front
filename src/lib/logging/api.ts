import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import type {
  FilterLogDto,
  ImpressionLogDto,
  OnboardingStepLogDto,
  ProductLogDto,
  ScanEventLogDto,
  SearchLogDto,
} from "@/lib/logging/types";

// 서버는 저장에 실패해도 200으로 답한다. 400은 필수값이 없거나 허용값이 아닐 때만 난다

function post<T>(
  http: AxiosInstance,
  path: string,
  body: T,
  config?: AxiosRequestConfig,
) {
  return http.post<ApiSuccess<undefined>>(path, body, config).then(unwrap);
}

/** 상품 상세 조회. 유효 방문으로 집계된다 */
export const postViewLog = (http: AxiosInstance, body: ProductLogDto) =>
  post(http, "/logging/view", body);

/**
 * 상품 상세의 구매·외부 이동 버튼. 누르자마자 페이지를 떠나 기본 XHR 요청은 취소될 수 있어, 페이지가
 * 닫혀도 브라우저가 끝까지 보내는 fetch keepalive로 보낸다. `sendBeacon`은 세션 ID 헤더를 실을 수 없다
 */
export const postCtaLog = (http: AxiosInstance, body: ProductLogDto) =>
  post(http, "/logging/cta", body, {
    adapter: "fetch",
    fetchOptions: { keepalive: true },
  });

/** 검색 로그는 인기 검색어 집계에 쓰인다 */
export const postSearchLog = (http: AxiosInstance, body: SearchLogDto) =>
  post(http, "/logging/search", body);

export const postFilterLog = (http: AxiosInstance, body: FilterLogDto) =>
  post(http, "/logging/filter", body);

export const postImpressionLog = (
  http: AxiosInstance,
  body: ImpressionLogDto,
) => post(http, "/logging/impression", body);

export const postScanEventLog = (http: AxiosInstance, body: ScanEventLogDto) =>
  post(http, "/logging/scan-event", body);

export const postOnboardingStepLog = (
  http: AxiosInstance,
  body: OnboardingStepLogDto,
) => post(http, "/logging/onboarding-step", body);
