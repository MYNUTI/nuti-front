import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fetchMyGoal, putMyGoal } from "@/lib/goal/api";
import { goalKeys } from "@/lib/goal/keys";
import type { Goal } from "@/lib/goal/types";
import { meKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { searchKeys } from "@/lib/search/keys";

export const goalQueries = {
  mine: () =>
    queryOptions({
      queryKey: goalKeys.mine(),
      queryFn: ({ signal }) => fetchMyGoal(api, signal),
    }),
};

export function useMyGoal() {
  return useQuery(goalQueries.mine());
}

// 성공 후 다시 불러올 조회는 API 작업 플랜 「기능 → 엔드포인트 매핑」의 초안이고 09단계에서 확정한다

export const goalMutations = {
  /** `recalcProductId`는 전·후 등급을 보여 줄 상품의 ID(상세 경로와 같은 문자열) */
  update: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: { goal: Goal; recalcProductId?: string }) =>
        putMyGoal(api, {
          goal: input.goal,
          recalcProductId:
            input.recalcProductId === undefined
              ? undefined
              : Number(input.recalcProductId),
        }),
      // 등급은 목표 기준이라 상품·검색 결과를 전부 다시 부른다. 열려 있는 상세는 조회수가 1 오른다(플랜에서 감수)
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: goalKeys.all }),
          queryClient.invalidateQueries({ queryKey: meKeys.summary() }),
          queryClient.invalidateQueries({ queryKey: meKeys.settings() }),
          queryClient.invalidateQueries({ queryKey: productKeys.all }),
          queryClient.invalidateQueries({ queryKey: searchKeys.results() }),
          queryClient.invalidateQueries({
            queryKey: onboardingKeys.bootstrap(),
          }),
        ]),
    }),
};

export function useUpdateGoal() {
  return useMutation(goalMutations.update(useQueryClient()));
}
