/**
 * 마이·설정·내 정보·약관 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 배포 Swagger(2026-11-21)와 백엔드 `main` `1ddb9b4`의 `MeSummaryResponse`, `MeSettingsResponse`,
 * `UserResponse`, `PoliciesResponse`. 날짜는 타임존 없는 ISO 문자열이다.
 *
 * 응답의 `goal`은 계정에 저장한 목표다(비로그인·「목표 계정 저장」 미동의면 저장한 값이 없어 대개 WEIGHT_LOSS. v3 전 익명 기록에 목표가 있으면 그 값). 화면의 내
 * 목표는 기기 목표(`useDeviceGoal`)를 쓴다(v3 기능명세 ACCT_002)
 */
import type { LoginProvider } from "@/lib/auth/types";
import type { Goal } from "@/lib/goal/types";

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

/** `GET /me/settings` */
export type MeSettingsDto = {
  goal: GoalLabelDto;
  /** 정책 URL이 아직 없으면 키가 빠진다 */
  policies: { privacyUrl?: string; termsUrl?: string };
  /** 서버 설정이 비어 있으면 없다 */
  supportUrl?: string;
  /** 플랫폼 표기 포함(예: 2.0.0-web) */
  appVersion: string;
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
