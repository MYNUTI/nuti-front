import axios from "axios";
import { toApiError } from "@/lib/api/errors";
import { ensureAnonymousId, touchSessionId } from "@/lib/api/identity";
import { getFreshAccessToken } from "@/lib/api/refresh";

function createInstance() {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    // 응답 없는 요청이 무한정 걸려 있지 않게 하는 상한. 백엔드 API는 DB 조회 위주라 넉넉히 잡은 값
    timeout: 10_000,
    // 타임아웃을 ETIMEDOUT으로 받아 요청이 끊긴 경우(ECONNABORTED)와 구분한다
    transitional: { clarifyTimeoutError: true },
  });
  instance.interceptors.response.use(undefined, (error) =>
    Promise.reject(toApiError(error)),
  );
  return instance;
}

export const api = createInstance();

// 토큰 갱신 요청 전용. api의 요청 인터셉터는 갱신을 기다리므로 갱신 요청이 그 인터셉터를 거치면
// 자기 자신을 기다린다
const refreshApi = createInstance();

// 토큰과 익명 ID를 함께 보낸다. 서버는 계정을 우선하고, 로그인(`POST /auth/oauth`)은 익명 ID로
// 로그인 전 기기 기록(저장·최근 본 제품·목표·기여)을 계정에 합친다. 익명 ID가 없으면 여기서 만든다
api.interceptors.request.use(async (config) => {
  const accessToken = await getFreshAccessToken(refreshApi);
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  config.headers.set("X-Anonymous-Id", ensureAnonymousId());
  // 세션 ID는 방문 집계에 쓰인다
  config.headers.set("X-Session-Id", touchSessionId());
  return config;
});
