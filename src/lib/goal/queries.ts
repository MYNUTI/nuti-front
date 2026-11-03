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
import { invalidateGoalDependents } from "@/lib/goal/invalidate";
import { goalKeys } from "@/lib/goal/keys";
import type { Goal } from "@/lib/goal/types";

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

// 성공 후 다시 불러올 조회는 API 작업 플랜 「기능 → 엔드포인트 매핑」을 따른다(09단계 확정)

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
      onSuccess: () => invalidateGoalDependents(queryClient),
    }),
};

export function useUpdateGoal() {
  return useMutation(goalMutations.update(useQueryClient()));
}
