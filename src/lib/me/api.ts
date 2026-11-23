import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import { toMeSettings, toMeSummary, toPolicies, toUser } from "@/lib/me/mapper";
import type {
  MeSettingsDto,
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
 * 로그인 전용. v3는 탈퇴 사유를 받지 않는다(백엔드 `UserController.deleteMe`). 성공 뒤 처리(토큰·익명 ID·
 * 기기 목표 정리, 사용자 캐시 비우기)는 `authMutations.withdraw`가 한다
 */
export function deleteUser(http: AxiosInstance) {
  return http.delete<ApiSuccess<undefined>>("/users/me").then(unwrap);
}

export function fetchMeSettings(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<MeSettingsDto>>("/me/settings", { signal })
    .then(unwrap)
    .then(toMeSettings);
}

export function fetchPolicies(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<PoliciesDto>>("/meta/policies", { signal })
    .then(unwrap)
    .then(toPolicies);
}
