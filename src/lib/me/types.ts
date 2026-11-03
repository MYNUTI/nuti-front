/**
 * 마이·설정·내 정보·약관 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 백엔드 커밋 c164ec0의 `MeSummaryResponse`, `MeSettingsResponse`·`MeSettingsUpdateRequest`,
 * `UserResponse`, `PoliciesResponse`. 날짜는 타임존 없는 ISO 문자열이다.
 */
import type { Goal } from "@/lib/goal/types";

// 로그인 흐름(11단계)의 auth 도메인을 만들 때 그쪽으로 옮긴다. APPLE은 서버 enum에만 있다(API 작업 플랜 「진행 가정」)
export type LoginProvider = "GOOGLE" | "KAKAO" | "NAVER" | "APPLE";

// ── DTO ──────────────────────────────────────────────────────────────────────

type GoalLabelDto = { code: Goal; label: string };

/** `GET /me/summary`. 비로그인이면 `profile`이 없다 */
export type MeSummaryDto = {
  isLoggedIn: boolean;
  profile?: {
    nickname: string;
    /** 소셜 계정에 이메일이 없으면 null */
    email: string | null;
    provider: LoginProvider;
  };
  goal: GoalLabelDto;
  /** 저장한 상품 수. 익명 ID 기준도 센다 */
  recordCount: number;
  contribution: {
    /** 내가 접수(자동 등록 포함)한 분석 대기 건수 */
    requestCount: number;
    /** 그중 처리 완료된 수 */
    publishedCount: number;
  };
  /** 비로그인일 때 「로그인하면 기기가 바뀌어도 기록이 유지돼요」 */
  footerNotice?: string;
};

/** `GET /users/me` */
export type UserDto = {
  id: number;
  email: string | null;
  nickname: string;
  provider: LoginProvider;
  role: "USER" | "ADMIN";
  createdAt: string;
};

/** `GET`·`PATCH /me/settings` */
export type MeSettingsDto = {
  clipboardLinkDetection: boolean;
  goal: GoalLabelDto;
  /** 정책 URL이 아직 없으면 키가 빠진다 */
  policies: { privacyUrl?: string; termsUrl?: string };
  /** 서버 설정이 비어 있으면 없다 */
  supportUrl?: string;
  /** 플랫폼 표기 포함(예: 2.0.0-web) */
  appVersion: string;
};

/** `PATCH /me/settings` 요청. 둘 다 없으면 400 */
export type MeSettingsUpdateRequestDto = {
  clipboardLinkDetection?: boolean;
  goal?: Goal;
};

/** `GET /meta/policies`. 정책이 아직 없으면 키가 빠진다 */
export type PoliciesDto = {
  privacy?: PolicyDto;
  terms?: PolicyDto;
};

export type PolicyDto = {
  version: string;
  url: string;
  /** 시행일 `yyyy-MM-dd` */
  updatedAt: string;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

export type GoalLabel = { goal: Goal; label: string };

export type MeSummary = {
  isLoggedIn: boolean;
  profile: NonNullable<MeSummaryDto["profile"]> | null;
  goal: GoalLabel;
  recordCount: number;
  contribution: MeSummaryDto["contribution"];
  footerNotice: string | null;
};

export type User = Omit<UserDto, "id"> & { id: string };

export type MeSettings = {
  clipboardLinkDetection: boolean;
  goal: GoalLabel;
  privacyUrl: string | null;
  termsUrl: string | null;
  supportUrl: string | null;
  appVersion: string;
};

export type Policies = {
  privacy: PolicyDto | null;
  terms: PolicyDto | null;
};
