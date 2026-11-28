import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import type {
  EventBatchDto,
  EventBatchResultDto,
  FilterLogDto,
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

export const postScanEventLog = (http: AxiosInstance, body: ScanEventLogDto) =>
  post(http, "/logging/scan-event", body);

/**
 * v3 앱 이벤트 묶음. 화면을 떠나는 순간(세션 끝, 구매 버튼 등)에 보내는 이벤트도 있어 CTA처럼 fetch keepalive로
 * 보낸다. keepalive 본문은 진행 중인 요청을 합쳐 64KB까지라(넘으면 실패해 버려진다) 지금은 `logEvent`가 한 개씩
 * 보낸다. 묶어 보내게 되면 서버 상한 100개보다 64KB가 먼저 걸린다
 */
export const postEvents = (http: AxiosInstance, body: EventBatchDto) =>
  http
    .post<ApiSuccess<EventBatchResultDto>>("/events", body, {
      adapter: "fetch",
      fetchOptions: { keepalive: true },
    })
    .then(unwrap);
