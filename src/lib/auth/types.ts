/**
 * 인증 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 배포 Swagger(2026-11-21)와 백엔드 `main` `1ddb9b4`의 `OAuthLoginRequest`, `SignupRequest`, `TokenResponse`.
 */
import type { ConsentItemCode } from "@/lib/consent/types";
import type { Goal } from "@/lib/goal/types";

/** APPLE은 서버 enum에만 있다(API 작업 플랜 「진행 가정」). 콜백 경로는 GOOGLE·KAKAO·NAVER뿐이다 */
export type LoginProvider = "GOOGLE" | "KAKAO" | "NAVER" | "APPLE";

// ── DTO ──────────────────────────────────────────────────────────────────────

/** `POST /auth/oauth` 요청. `code`는 백엔드 콜백이 프론트로 넘긴 인가 코드다 */
export type OAuthLoginRequestDto = { provider: LoginProvider; code: string };

/** 가입 동의 화면(5-6)에 보여 줄 회사 계정 정보. 가입을 마칠 때까지 서버에 저장하지 않는다 */
export type SignupProfileDto = {
  provider: LoginProvider;
  email: string | null;
  nickname: string | null;
};

/** 요청 헤더의 기기 ID에서 계정으로 옮긴 기록 수(종류별) */
export type MergedDto = {
  savedProducts: number;
  goals: number;
  history: number;
  analysisRequests: number;
  reports: number;
};

type UserSummaryDto = {
  id: number;
  /** 소셜 계정에 이메일이 없으면 null */
  email: string | null;
  nickname: string;
  provider: LoginProvider;
};

/**
 * `POST /auth/oauth`·`POST /auth/signup`. 처음 로그인한 계정이면 계정을 만들지 않고 토큰 없이 `signupRequired`·
 * `signupToken`(30분)·`signupProfile`만 준다(v3 기능명세 ACCT_004). `signupRequired`는 false면 키가 빠지고,
 * 그 밖의 선택 필드는 null이면 키가 빠진다. 재발급(`/auth/refresh`)도 같은 모양이지만 토큰 둘만 쓴다
 */
export type TokenDto =
  | {
      signupRequired: true;
      signupToken: string;
      signupProfile: SignupProfileDto;
      accessToken: null;
      refreshToken: null;
      newUser: boolean;
    }
  | {
      signupRequired?: false;
      accessToken: string;
      refreshToken: string;
      /** 이번 요청으로 가입됨(`POST /auth/signup`) */
      newUser: boolean;
      merged?: MergedDto;
      /** 옮긴 기록 합계. 옮길 것이 없으면 0 */
      mergedRecordCount?: number;
      user?: UserSummaryDto;
    };

/** 토큰을 받은 응답. `POST /auth/signup`은 늘 이 모양이다(가입을 마쳐 계정이 있다) */
export type SignedInTokenDto = Exclude<TokenDto, { signupRequired: true }>;

/**
 * `POST /auth/signup` 요청(5-6 「동의하고 시작하기」). `agreements`는 항목 코드 → 동의 여부이고 필수
 * AGE_14·TERMS·PRIVACY가 모두 true여야 한다(아니면 400 `REQUIRED_CONSENT_MISSING`). 빠진 선택 항목은 false로
 * 기록된다. `goal`은 「목표 계정 저장」에 동의했을 때 계정에 저장된다
 */
export type SignupRequestDto = {
  signupToken: string;
  agreements: Partial<Record<ConsentItemCode, boolean>>;
  termsVersion?: string;
  privacyVersion?: string;
  /** 항목 코드 → 동의문 판(목표 저장·몸 정보) */
  documentVersions?: Partial<Record<ConsentItemCode, string>>;
  goal?: Goal;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

export type SignupProfile = SignupProfileDto;
export type Merged = MergedDto;

export type User = {
  id: string;
  email: string | null;
  nickname: string;
  provider: LoginProvider;
};

/** 로그인 결과. 처음 로그인이면 토큰이 없어 가입 동의(5-6)로 보낸다 */
export type LoginResult =
  | {
      status: "SIGNED_IN";
      newUser: boolean;
      mergedRecordCount: number;
      merged: Merged | null;
      user: User | null;
    }
  | {
      status: "SIGNUP_REQUIRED";
      signupToken: string;
      profile: SignupProfile;
    };

export type SignedIn = Extract<LoginResult, { status: "SIGNED_IN" }>;

/**
 * 가입 입력. 약관·처리방침 판은 가입 동의 항목(`useConsentItems`)이 준 값을 그대로 보낸다. 목표는 넣지
 * 않는다 — 「목표 계정 저장」에 동의했을 때만 5-6c에서 기기에 저장한 목표를 가입할 때 읽어 보낸다
 */
export type SignupInput = Omit<SignupRequestDto, "goal">;
