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
 * 계정 목표 저장. 로그인하지 않았으면 401, 「목표 계정 저장」에 동의하지 않았으면 403
 * `GOAL_CONSENT_REQUIRED`(백엔드 `GoalService.requireGoalConsent`. Swagger 설명의 「동의는 필요 없습니다」는
 * 소스와 다르다)
 */
export function putMyGoal(http: AxiosInstance, body: GoalUpdateRequestDto) {
  return http
    .put<ApiSuccess<GoalUpdateDto>>("/me/goal", body)
    .then(unwrap)
    .then(toGoalUpdate);
}
