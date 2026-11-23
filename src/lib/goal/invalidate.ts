import type { QueryClient } from "@tanstack/react-query";
import { goalKeys } from "@/lib/goal/keys";
import { meKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { savedKeys } from "@/lib/saved/keys";
import { searchKeys } from "@/lib/search/keys";

/**
 * 계정 목표가 바뀐 뒤 다시 부를 조회. 계정 목표를 보여 주는 조회(목표·마이·설정·bootstrap)와, 아직 계정
 * 목표로 계산되는 목록(검색·저장)이다. 상품 결과는 두 목표 점수를 함께 주고 더 맞는 제품은 기기 목표를 실어
 * 보내 다시 부르지 않는다. 상세를 다시 부르면 조회수만 오른다
 */
export function invalidateGoalDependents(queryClient: QueryClient) {
  return Promise.all(
    [
      goalKeys.all,
      meKeys.summary(),
      meKeys.settings(),
      onboardingKeys.bootstrap(),
      // 저장 목록은 goal을 받지 않고 검색은 goal을 빼면 계정 목표로 계산한다. 13-3 저장·검색에서 기기 목표를
      // 늘 실어 보내게 바꾸면 뺀다
      searchKeys.results(),
      savedKeys.all,
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}
