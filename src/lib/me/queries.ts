import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { invalidateGoalDependents } from "@/lib/goal/invalidate";
import {
  fetchMeSettings,
  fetchMeSummary,
  fetchPolicies,
  fetchUser,
  patchMeSettings,
} from "@/lib/me/api";
import { meKeys, metaKeys } from "@/lib/me/keys";
import type { MeSettingsUpdateRequestDto } from "@/lib/me/types";
import { onboardingKeys } from "@/lib/onboarding/keys";

export const meQueries = {
  summary: () =>
    queryOptions({
      queryKey: meKeys.summary(),
      queryFn: ({ signal }) => fetchMeSummary(api, signal),
    }),
  /** 토큰이 없으면 401이다. `bootstrap.isLoggedIn`일 때만 부른다 */
  user: () =>
    queryOptions({
      queryKey: meKeys.user(),
      queryFn: ({ signal }) => fetchUser(api, signal),
    }),
  settings: () =>
    queryOptions({
      queryKey: meKeys.settings(),
      queryFn: ({ signal }) => fetchMeSettings(api, signal),
    }),
  policies: () =>
    queryOptions({
      queryKey: metaKeys.policies(),
      queryFn: ({ signal }) => fetchPolicies(api, signal),
    }),
};

export function useMeSummary() {
  return useQuery(meQueries.summary());
}

export function useUser({ enabled = true } = {}) {
  return useQuery({ ...meQueries.user(), enabled });
}

export function useMeSettings() {
  return useQuery(meQueries.settings());
}

export function usePolicies() {
  return useQuery(meQueries.policies());
}

// 성공 후 다시 불러올 조회는 API 작업 플랜 「기능 → 엔드포인트 매핑」을 따른다(09단계 확정)

export const meMutations = {
  updateSettings: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (body: MeSettingsUpdateRequestDto) =>
        patchMeSettings(api, body),
      onSuccess: (settings, body) => {
        queryClient.setQueryData(meKeys.settings(), settings);
        // bootstrap은 목표와 링크 감지 설정을 둘 다 담는다
        // 목표가 바뀌면 목표에 딸린 조회를 다시 부른다. 설정도 다시 부르지만 부수 효과 없는 조회라 감수한다
        if (body.goal !== undefined)
          return invalidateGoalDependents(queryClient);
        return queryClient.invalidateQueries({
          queryKey: onboardingKeys.bootstrap(),
        });
      },
    }),
};

export function useUpdateMeSettings() {
  return useMutation(meMutations.updateSettings(useQueryClient()));
}
