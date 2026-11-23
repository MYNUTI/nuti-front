import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { readIdentity } from "@/lib/api/identity";
import { fetchMyGoal, putMyGoal } from "@/lib/goal/api";
import { saveDeviceGoal } from "@/lib/goal/device";
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

/**
 * 계정에 저장한 목표와 「목표 계정 저장」 동의 여부. 화면의 내 목표는 기기 목표(`useDeviceGoal`)다.
 * 비로그인·동의 안 함이면 늘 WEIGHT_LOSS로 답한다
 */
export function useMyGoal() {
  return useQuery(goalQueries.mine());
}

/**
 * 로그인하고 「목표 계정 저장」에 동의한 계정이면 목표를 계정에도 저장한다. 계정에 저장했으면 true.
 * 실패해도 기기 목표는 바뀐 채 두고 알리지 않는다(ACCT_002 「계정 목표 저장이 실패했을 때」)
 */
async function saveAccountGoal(queryClient: QueryClient, goal: Goal) {
  if (readIdentity().refreshToken === null) return false;
  try {
    const mine = await queryClient.fetchQuery(goalQueries.mine());
    if (!mine.goalAccountConsented) return false;
    await putMyGoal(api, { goal });
    return true;
  } catch {
    // TODO: 다음 연결 때 계정 목표를 다시 저장한다(ACCT_002). 언제 다시 보낼지 정하지 않았다
    return false;
  }
}

/**
 * 로그인 뒤 계정에 저장한 목표가 있으면 기기 목표를 그 값으로 맞춘다. 다른 기기에서도 같은 목표로 보게
 * 하려는 것이 계정 저장의 목적이라서다(ONB_009). 기능명세에 시나리오가 없어 확인 대기(API 플랜 「남은 질문」)
 */
export async function applyAccountGoal(queryClient: QueryClient) {
  const mine = await queryClient.fetchQuery(goalQueries.mine());
  if (mine.goalAccountConsented && mine.appliedAt !== null)
    saveDeviceGoal(mine.goal);
}

export const goalMutations = {
  /**
   * 내 목표를 바꾼다(1-5 · 5-2 · 5-6c). 기기에 바로 저장하고, 동의한 로그인 계정이면 계정에도 저장한다.
   * 점수는 결과가 두 목표를 함께 줘 다시 부르지 않는다. 계정 목표를 보여 주는 조회만 다시 부른다
   */
  change: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: async (goal: Goal) => {
        saveDeviceGoal(goal);
        return saveAccountGoal(queryClient, goal);
      },
      onSuccess: (savedToAccount) => {
        if (savedToAccount) return invalidateGoalDependents(queryClient);
      },
    }),
};

export function useChangeGoal() {
  return useMutation(goalMutations.change(useQueryClient()));
}
