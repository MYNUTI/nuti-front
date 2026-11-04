import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import {
  toBootstrap,
  toHealthConsent,
  toSampleProducts,
} from "@/lib/onboarding/mapper";
import type {
  BootstrapDto,
  ConsentRequestDto,
  HealthConsentDto,
  OnboardingCompleteDto,
  OnboardingCompleteRequestDto,
  PrivacyConsentDto,
  SamplePickerDto,
} from "@/lib/onboarding/types";

/** 익명 ID를 발급하지 않는다. 발급은 개인정보 동의가 한다 */
export function fetchBootstrap(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<BootstrapDto>>("/app/bootstrap", { signal })
    .then(unwrap)
    .then(toBootstrap);
}

/** 정책 버전이 현재와 다르면 409 `POLICY_VERSION_CONFLICT`, 필수 항목이 빠지면 400 */
export function postPrivacyConsent(
  http: AxiosInstance,
  body: ConsentRequestDto,
) {
  return http
    .post<ApiSuccess<PrivacyConsentDto>>("/onboarding/consent", body)
    .then(unwrap);
}

/** 토큰·익명 ID가 모두 없으면 403 `CONSENT_REQUIRED`, 정책 버전이 현재 HEALTH 정책과 다르면 409 */
export function postHealthConsent(
  http: AxiosInstance,
  body: ConsentRequestDto,
) {
  return http
    .post<ApiSuccess<HealthConsentDto>>("/me/health-consent", body)
    .then(unwrap)
    .then(toHealthConsent);
}

/** 토큰·익명 ID가 모두 없으면 403 `CONSENT_REQUIRED` */
export function fetchHealthConsent(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<HealthConsentDto>>("/me/health-consent", { signal })
    .then(unwrap)
    .then(toHealthConsent);
}

/** 목표가 GENERAL로 돌아간다. 이미 철회 상태여도 200 */
export function deleteHealthConsent(http: AxiosInstance) {
  return http
    .delete<ApiSuccess<HealthConsentDto>>("/me/health-consent")
    .then(unwrap)
    .then(toHealthConsent);
}

/** `size`는 서버 기본 6, 최대 12 */
export function fetchSamples(
  http: AxiosInstance,
  size?: number,
  signal?: AbortSignal,
) {
  return http
    .get<ApiSuccess<SamplePickerDto>>("/onboarding/samples", {
      params: { size },
      signal,
    })
    .then(unwrap)
    .then(toSampleProducts);
}

/** 이미 완료여도 200 */
export function postOnboardingComplete(
  http: AxiosInstance,
  body: OnboardingCompleteRequestDto = {},
) {
  return http
    .post<ApiSuccess<OnboardingCompleteDto>>("/onboarding/complete", body)
    .then(unwrap);
}
