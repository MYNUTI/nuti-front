/**
 * 온보딩·동의 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 백엔드 커밋 c164ec0의 `BootstrapResponse`, `ConsentRequest`·`ConsentResponse`, `HealthConsentResponse`,
 * `SamplePickerResponse`, `OnboardingComplete*`. 날짜는 타임존 없는 ISO 문자열(`yyyy-MM-ddTHH:mm:ss`)이다.
 */
import type { Goal, GradeLetter } from "@/lib/product/types";

// 서버 설정 기본값(`app.consent.required-items`). 팀 확정 사항이라 바뀔 수 있다(API 작업 플랜 「진행 가정」)
export const PRIVACY_CONSENT_ITEMS = ["PERSONAL_INFO", "AGE_OVER_14"] as const;

// ── DTO ──────────────────────────────────────────────────────────────────────

/** `GET /app/bootstrap` */
export type BootstrapDto = {
  isLoggedIn: boolean;
  consentAgreed: boolean;
  healthConsented: boolean;
  onboardingCompleted: boolean;
  /** 미설정·동의 전은 GENERAL */
  goal: Goal;
  clipboardLinkDetection: boolean;
  /** 현재 개인정보 처리방침 버전. 정책이 아직 없으면 없다 */
  currentPolicyVersion?: string;
};

/** `POST /onboarding/consent`·`POST /me/health-consent` 요청 */
export type ConsentRequestDto = {
  policyVersion: string;
  agreedItems?: string[];
};

/** `POST /onboarding/consent` */
export type PrivacyConsentDto = {
  /** 로그인 상태에서 동의하면 새로 발급하지 않아 요청 헤더 값 그대로다(없으면 null) */
  anonymousId: string | null;
  agreedAt: string;
};

/** `/me/health-consent` 조회·동의·철회 공통. 미동의는 오류가 아니라 false */
export type HealthConsentDto = {
  healthConsented: boolean;
  /** 동의 상태일 때만 온다 */
  agreedAt?: string;
};

/** `GET /onboarding/samples`. 분석 완료 제품만, 등급은 일반 기준 */
export type SamplePickerDto = {
  items: {
    productId: number;
    name: string;
    imageUrl: string | null;
    grade: GradeLetter;
  }[];
};

/** `POST /onboarding/complete` 요청 */
export type OnboardingCompleteRequestDto = {
  /** 참고용. 단계 기록은 온보딩 단계 로그가 맡는다 */
  skippedSteps?: string[];
};

/** `POST /onboarding/complete` */
export type OnboardingCompleteDto = {
  onboardingCompleted: boolean;
  completedAt: string;
  /** 동의 전이라 저장할 ID가 없으면 false. 이때는 클라이언트가 완료를 기억한다 */
  persisted: boolean;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

export type Bootstrap = Omit<BootstrapDto, "currentPolicyVersion"> & {
  currentPolicyVersion: string | null;
};

export type HealthConsent = {
  healthConsented: boolean;
  agreedAt: string | null;
};

export type SampleProduct = {
  /** 상세 경로와 맞춰 문자열 */
  id: string;
  name: string;
  imageUrl: string | null;
  grade: GradeLetter;
};
