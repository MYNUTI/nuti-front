import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  fetchConsentItems,
  fetchMyConsents,
  putConsent,
} from "@/lib/consent/api";
import { consentItemKeys, consentKeys } from "@/lib/consent/keys";
import type { ConsentChangeInput } from "@/lib/consent/types";
import { readDeviceGoal } from "@/lib/goal/device";
import { invalidateGoalDependents } from "@/lib/goal/invalidate";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { savedKeys } from "@/lib/saved/keys";
import { searchKeys } from "@/lib/search/keys";

export const consentQueries = {
  /** 5-6 가입 동의 화면의 항목과 지금 약관·처리방침 판 */
  items: () =>
    queryOptions({
      queryKey: consentItemKeys.all(),
      queryFn: ({ signal }) => fetchConsentItems(api, signal),
    }),
  /** 5-5b 동의 관리. 토큰이 없으면 401이라 로그인했을 때만 부른다 */
  mine: () =>
    queryOptions({
      queryKey: consentKeys.mine(),
      queryFn: ({ signal }) => fetchMyConsents(api, signal),
    }),
};

export function useConsentItems() {
  return useQuery(consentQueries.items());
}

export function useMyConsents({ enabled = true } = {}) {
  return useQuery({ ...consentQueries.mine(), enabled });
}

export const consentMutations = {
  /**
   * 선택 동의를 켜거나 철회한다(5-5b). 목표 저장을 켜면 기기 목표를 함께 보내 계정에 저장한다(ONB_009).
   * 응답(항목 6개)으로 내 동의를 바꾸고, 동의 상태를 담는 bootstrap을 다시 부른다. 목표 저장은 계정 목표가
   * 바뀌어(켜면 저장, 철회하면 삭제) 계정 목표를 보여 주는 조회를, 몸 정보는 칼로리 구간이 바뀌어 점수를 담은
   * 조회(상품·검색·저장)도 다시 부른다
   */
  change: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: ({ item, agreed, documentVersion }: ConsentChangeInput) =>
        putConsent(api, item, {
          agreed,
          documentVersion,
          goal:
            item === "GOAL_ACCOUNT" && agreed
              ? (readDeviceGoal() ?? undefined)
              : undefined,
        }),
      onSuccess: (consents, { item }) => {
        queryClient.setQueryData(consentKeys.mine(), consents);
        if (item === "GOAL_ACCOUNT")
          return invalidateGoalDependents(queryClient);
        // 몸 정보 동의는 칼로리 구간을 바꿔(철회하면 서버가 몸 정보를 지우고 2,000으로) 감량 점수를 담은 조회가
        // 달라진다. 철회한 민감정보로 계산한 점수가 남지 않게 다시 부른다. 열려 있는 상세는 조회수가 1 오른다
        const keys =
          item === "BODY_PROFILE"
            ? [
                onboardingKeys.bootstrap(),
                productKeys.all,
                searchKeys.results(),
                savedKeys.all,
              ]
            : [onboardingKeys.bootstrap()];
        return Promise.all(
          keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        );
      },
    }),
};

export function useChangeConsent() {
  return useMutation(consentMutations.change(useQueryClient()));
}
