import "server-only";
import axios from "axios";
import { toApiError } from "@/lib/api/errors";
import {
  readServerIdentity,
  readServerSessionId,
} from "@/lib/api/identity.server";

/**
 * 서버 컴포넌트용 axios 인스턴스. 서버에서는 CORS가 없으니 rewrites(`/api`)를 거치지 않고
 * 서버 전용 `API_URL`의 백엔드 주소로 바로 보낸다. `NEXT_PUBLIC_`이 아니라 브라우저 번들에 들어가지 않는다.
 */
export const serverApi = axios.create({
  baseURL: process.env.API_URL,
  // 상한 값과 근거, 타임아웃 오류 구분은 client.ts와 같다
  timeout: 10_000,
  transitional: { clarifyTimeoutError: true },
});

// 렌더 중에는 쿠키를 쓸 수 없어 여기서는 토큰을 갱신하지 않는다. 만료가 가까운 토큰은 상세 경로에
// 한해 렌더 전에 `src/proxy.ts`가 바꿔 둔다. 다른 경로에서 쓰면 만료 토큰이 비로그인으로 처리된다.
// 세션 ID는 첫 방문처럼 쿠키가 없으면 빼고 보낸다
serverApi.interceptors.request.use(async (config) => {
  const { accessToken, anonymousId } = await readServerIdentity();
  const sessionId = await readServerSessionId();
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  if (anonymousId) config.headers.set("X-Anonymous-Id", anonymousId);
  if (sessionId) config.headers.set("X-Session-Id", sessionId);
  return config;
});

serverApi.interceptors.response.use(undefined, (error) =>
  Promise.reject(toApiError(error)),
);
