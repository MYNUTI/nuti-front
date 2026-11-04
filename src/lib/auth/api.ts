import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import type {
  LoginDto,
  LogoutDto,
  OAuthLoginRequestDto,
} from "@/lib/auth/types";

/**
 * 요청에 익명 ID 헤더가 있으면 서버가 그 기록을 계정으로 옮긴다. 인가 코드 교환·사용자 조회에 실패하면
 * 401 `LOGIN_FAILED`(서버 기본 문구가 비밀번호 문구라 화면 전용 문구를 쓴다 — API 작업 플랜 「남은 질문」)
 */
export function postOAuthLogin(
  http: AxiosInstance,
  body: OAuthLoginRequestDto,
) {
  return http.post<ApiSuccess<LoginDto>>("/auth/oauth", body).then(unwrap);
}

/** 로그인 전용. 서버는 이 사용자의 토큰을 모두 지우고 새 익명 ID를 준다 */
export function postLogout(http: AxiosInstance) {
  return http.post<ApiSuccess<LogoutDto>>("/auth/logout").then(unwrap);
}
