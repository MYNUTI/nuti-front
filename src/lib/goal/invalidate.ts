import type { QueryClient } from "@tanstack/react-query";
import { goalKeys } from "@/lib/goal/keys";
import { meKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";

/**
 * 계정 목표가 바뀐 뒤 다시 부를 조회. 계정 목표를 보여 주는 조회(목표·마이·설정·bootstrap)만이다. 상품 결과는
 * 두 목표 점수를 함께 주고 목록(검색·저장·더 맞는 제품)은 기기 목표를 실어 보내 다시 부르지 않는다. 상세를
 * 다시 부르면 조회수만 오른다
 */
export function invalidateGoalDependents(queryClient: QueryClient) {
  return Promise.all(
    [
      goalKeys.all,
      meKeys.summary(),
      meKeys.settings(),
      onboardingKeys.bootstrap(),
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}
