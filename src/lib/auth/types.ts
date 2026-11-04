/**
 * 인증 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 백엔드 커밋 c164ec0의 `OAuthLoginRequest`, `TokenResponse`, `LogoutResponse`.
 */

/** APPLE은 서버 enum에만 있다(API 작업 플랜 「진행 가정」). 콜백 경로는 GOOGLE·KAKAO·NAVER뿐이다 */
export type LoginProvider = "GOOGLE" | "KAKAO" | "NAVER" | "APPLE";

// ── DTO ──────────────────────────────────────────────────────────────────────

/** `POST /auth/oauth` 요청. `code`는 백엔드 콜백이 프론트로 넘긴 인가 코드다 */
export type OAuthLoginRequestDto = { provider: LoginProvider; code: string };

/** `POST /auth/oauth`. 재발급(`/auth/refresh`)도 같은 모양이지만 토큰 둘만 쓴다 */
export type LoginDto = {
  accessToken: string;
  refreshToken: string;
  /** 이번 로그인으로 가입됨(탈퇴 후 재가입 포함) */
  newUser: boolean;
  /** 요청 헤더의 익명 ID에서 계정으로 옮긴 저장·목표·기여 건수. 옮길 것이 없으면 0 */
  mergedRecordCount?: number;
  user?: {
    id: number;
    /** 소셜 계정에 이메일이 없으면 null */
    email: string | null;
    nickname: string;
    provider: LoginProvider;
  };
};

/** `POST /auth/logout`. 서버가 새로 발급한 익명 ID(로그인 전 개인정보 동의를 옮겨 둔다) */
export type LogoutDto = { anonymousId: string };

// ── 화면 모델 ────────────────────────────────────────────────────────────────

export type LoginResult = {
  newUser: boolean;
  mergedRecordCount: number;
  user: {
    id: string;
    email: string | null;
    nickname: string;
    provider: LoginProvider;
  } | null;
};
