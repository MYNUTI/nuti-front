import axios from "axios";
import { readIdentity } from "@/lib/api/identity";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // 응답 없는 요청이 무한정 걸려 있지 않게 하는 상한. 백엔드 API는 DB 조회 위주라 넉넉히 잡은 값
  timeout: 10_000,
});

// 토큰과 익명 ID가 둘 다 있어도 함께 보낸다. 서버는 계정을 우선하고, 로그인(`POST /auth/oauth`)은
// 익명 ID로 로그인 전 익명 기록(저장·목표·기여)을 계정에 합친다
api.interceptors.request.use((config) => {
  const { accessToken, anonymousId } = readIdentity();
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  if (anonymousId) config.headers.set("X-Anonymous-Id", anonymousId);
  return config;
});
