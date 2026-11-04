import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import { toMeSettings, toMeSummary, toPolicies, toUser } from "@/lib/me/mapper";
import type {
  MeSettingsDto,
  MeSettingsUpdateRequestDto,
  MeSummaryDto,
  PoliciesDto,
  UserDto,
} from "@/lib/me/types";

export function fetchMeSummary(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<MeSummaryDto>>("/me/summary", { signal })
    .then(unwrap)
    .then(toMeSummary);
}

/** 로그인 전용. 토큰이 없으면 401 */
export function fetchUser(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<UserDto>>("/users/me", { signal })
    .then(unwrap)
    .then(toUser);
}

/**
 * 로그인 전용. 사유는 Swagger대로 query로 보낸다(노션 명세의 body와 다르다). 성공 뒤 처리(토큰·익명 ID
 * 정리, 사용자 캐시 비우기)는 `authMutations.withdraw`가 한다
 */
export function deleteUser(http: AxiosInstance, reason?: string) {
  return http
    .delete<ApiSuccess<undefined>>("/users/me", { params: { reason } })
    .then(unwrap);
}

export function fetchMeSettings(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<MeSettingsDto>>("/me/settings", { signal })
    .then(unwrap)
    .then(toMeSettings);
}

/**
 * 바꿀 항목이 없으면 400, 토큰·익명 ID가 모두 없으면 403 `CONSENT_REQUIRED`, 감량·근육증가인데 건강정보
 * 동의가 없으면 403 `HEALTH_CONSENT_REQUIRED`. 목표를 바꿔도 재계산 결과는 주지 않는다
 */
export function patchMeSettings(
  http: AxiosInstance,
  body: MeSettingsUpdateRequestDto,
) {
  return http
    .patch<ApiSuccess<MeSettingsDto>>("/me/settings", body)
    .then(unwrap)
    .then(toMeSettings);
}

export function fetchPolicies(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<PoliciesDto>>("/meta/policies", { signal })
    .then(unwrap)
    .then(toPolicies);
}
