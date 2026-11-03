import {
  mutationOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { postAnalysisRequest } from "@/lib/contribution/api";
import type { AnalysisRequestInput } from "@/lib/contribution/types";
import { meKeys } from "@/lib/me/keys";

// 조회 API가 없어 쿼리 키를 두지 않는다. 성공 후 다시 불러올 조회는 API 작업 플랜 「기능 → 엔드포인트
// 매핑」의 초안이고 09단계에서 확정한다

export const contributionMutations = {
  requestAnalysis: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: AnalysisRequestInput) =>
        postAnalysisRequest(api, input),
      // 마이는 내가 접수한 분석 요청 수를 보여 준다
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: meKeys.summary() }),
    }),
};

export function useRequestAnalysis() {
  return useMutation(contributionMutations.requestAnalysis(useQueryClient()));
}
