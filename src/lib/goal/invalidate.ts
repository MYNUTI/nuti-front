import type { QueryClient } from "@tanstack/react-query";
import { goalKeys } from "@/lib/goal/keys";
import { meKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { savedKeys } from "@/lib/saved/keys";
import { searchKeys } from "@/lib/search/keys";

/**
 * 목표가 바뀐 뒤 다시 부를 조회. 목표 변경·설정의 목표 변경·건강정보 철회(목표가 GENERAL로 돌아감)가
 * 같이 쓴다. 등급이 목표 기준인 조회(상품·검색·저장)와 목표를 보여 주는 조회(목표·마이·설정·bootstrap)다.
 * 등급이 보이는 조회를 새로 만들면 여기에 넣는다. 열려 있는 상세는 조회수가 1 오른다(플랜에서 감수)
 */
export function invalidateGoalDependents(queryClient: QueryClient) {
  return Promise.all(
    [
      goalKeys.all,
      meKeys.summary(),
      meKeys.settings(),
      onboardingKeys.bootstrap(),
      productKeys.all,
      searchKeys.results(),
      savedKeys.all,
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}
