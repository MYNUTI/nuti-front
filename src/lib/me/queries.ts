import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { goalKeys } from "@/lib/goal/keys";
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
import { productKeys } from "@/lib/product/keys";
import { searchKeys } from "@/lib/search/keys";

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

// 성공 후 다시 불러올 조회는 API 작업 플랜 「기능 → 엔드포인트 매핑」의 초안이고 09단계에서 확정한다

export const meMutations = {
  updateSettings: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (body: MeSettingsUpdateRequestDto) =>
        patchMeSettings(api, body),
      onSuccess: (settings, body) => {
        queryClient.setQueryData(meKeys.settings(), settings);
        // bootstrap은 목표와 링크 감지 설정을 둘 다 담는다
        const invalidations = [
          queryClient.invalidateQueries({
            queryKey: onboardingKeys.bootstrap(),
          }),
        ];
        // 목표가 바뀌면 등급이 목표 기준인 조회와 목표를 보여 주는 조회를 다시 부른다. 열려 있는 상세는
        // 조회수가 1 오른다(플랜에서 감수)
        if (body.goal !== undefined)
          invalidations.push(
            queryClient.invalidateQueries({ queryKey: goalKeys.all }),
            queryClient.invalidateQueries({ queryKey: meKeys.summary() }),
            queryClient.invalidateQueries({ queryKey: productKeys.all }),
            queryClient.invalidateQueries({ queryKey: searchKeys.results() }),
          );
        return Promise.all(invalidations);
      },
    }),
};

export function useUpdateMeSettings() {
  return useMutation(meMutations.updateSettings(useQueryClient()));
}
