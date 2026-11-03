import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import { toGoalUpdate, toMyGoal } from "@/lib/goal/mapper";
import type {
  GoalDto,
  GoalUpdateDto,
  GoalUpdateRequestDto,
} from "@/lib/goal/types";

export function fetchMyGoal(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<GoalDto>>("/me/goal", { signal })
    .then(unwrap)
    .then(toMyGoal);
}

/**
 * 토큰·익명 ID가 모두 없으면 403 `CONSENT_REQUIRED`, 감량·근육증가인데 건강정보 동의가 없으면
 * 403 `HEALTH_CONSENT_REQUIRED`
 */
export function putMyGoal(http: AxiosInstance, body: GoalUpdateRequestDto) {
  return http
    .put<ApiSuccess<GoalUpdateDto>>("/me/goal", body)
    .then(unwrap)
    .then(toGoalUpdate);
}
