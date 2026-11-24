import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import type {
  OAuthLoginRequestDto,
  SignedInTokenDto,
  SignupRequestDto,
  TokenDto,
} from "@/lib/auth/types";

/**
 * 가입한 계정이면 토큰을 주고, 요청에 익명 ID 헤더가 있으면 서버가 그 기록을 계정으로 옮긴다. 처음 로그인한
 * 계정이면 토큰 없이 `signupRequired`·`signupToken`만 준다. 인가 코드 교환·사용자 조회에 실패하면 401
 * `LOGIN_FAILED`(서버 기본 문구가 비밀번호 문구라 화면 전용 문구를 쓴다 — API 작업 플랜 「남은 질문」)
 */
export function postOAuthLogin(
  http: AxiosInstance,
  body: OAuthLoginRequestDto,
) {
  return http.post<ApiSuccess<TokenDto>>("/auth/oauth", body).then(unwrap);
}

/**
 * 가입 동의 뒤 계정을 만든다. 기기 기록 병합은 로그인과 같다. 필수 동의가 빠지면 400
 * `REQUIRED_CONSENT_MISSING`, 가입 토큰이 만료·위조됐으면 401 `SIGNUP_TOKEN_INVALID`(다시 로그인), 약관·처리방침
 * 판이 지금 판과 다르면 409 `POLICY_VERSION_CONFLICT`
 */
export function postSignup(http: AxiosInstance, body: SignupRequestDto) {
  return http
    .post<ApiSuccess<SignedInTokenDto>>("/auth/signup", body)
    .then(unwrap);
}

/** 로그인 전용. 서버는 이 사용자의 refresh 토큰을 모두 지운다. 새 익명 ID는 주지 않는다(클라이언트가 만든다) */
export function postLogout(http: AxiosInstance) {
  return http.post<ApiSuccess<null>>("/auth/logout").then(unwrap);
}
