import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { saveAnonymousId } from "@/lib/api/identity";
import {
  deleteHealthConsent,
  fetchBootstrap,
  fetchHealthConsent,
  fetchSamples,
  postHealthConsent,
  postOnboardingComplete,
  postPrivacyConsent,
} from "@/lib/onboarding/api";
import { onboardingKeys } from "@/lib/onboarding/keys";
import {
  isOnboardingCompletedLocally,
  rememberOnboardingCompleted,
} from "@/lib/onboarding/storage";
import {
  PRIVACY_CONSENT_ITEMS,
  type OnboardingCompleteRequestDto,
} from "@/lib/onboarding/types";
import { productKeys } from "@/lib/product/keys";

export const onboardingQueries = {
  bootstrap: () =>
    queryOptions({
      queryKey: onboardingKeys.bootstrap(),
      queryFn: ({ signal }) => fetchBootstrap(api, signal),
      // 동의 전에 끝낸 온보딩은 서버가 모른다. 이 기기에 기억한 완료를 함께 본다
      select: (bootstrap) => ({
        ...bootstrap,
        onboardingCompleted:
          bootstrap.onboardingCompleted || isOnboardingCompletedLocally(),
      }),
    }),
  /** 토큰·익명 ID가 모두 없으면 403이다. `bootstrap.isLoggedIn`이거나 `consentAgreed`일 때만 부른다 */
  healthConsent: () =>
    queryOptions({
      queryKey: onboardingKeys.healthConsent(),
      queryFn: ({ signal }) => fetchHealthConsent(api, signal),
    }),
  samples: (size?: number) =>
    queryOptions({
      queryKey: onboardingKeys.samples(size),
      queryFn: ({ signal }) => fetchSamples(api, size, signal),
    }),
};

export function useBootstrap() {
  return useQuery(onboardingQueries.bootstrap());
}

export function useHealthConsent({ enabled = true } = {}) {
  return useQuery({ ...onboardingQueries.healthConsent(), enabled });
}

export function useSamples(size?: number) {
  return useQuery(onboardingQueries.samples(size));
}

// 성공 후 다시 불러올 조회는 API 작업 플랜 「기능 → 엔드포인트 매핑」의 초안이다. 다른 도메인(목표 등)은
// 그 도메인을 만들 때 넣고 09단계에서 확정한다. 옵션을 훅과 나눠 렌더 없이 테스트한다

export const onboardingMutations = {
  /** `policyVersion`은 `bootstrap.currentPolicyVersion`을 보낸다 */
  agreePrivacy: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: async (policyVersion: string) => {
        const result = await postPrivacyConsent(api, {
          policyVersion,
          agreedItems: [...PRIVACY_CONSENT_ITEMS],
        });
        // 다음 요청부터 헤더에 붙도록 무효화 전에 저장한다. 로그인 상태면 새로 발급하지 않고 보낸 헤더 값(없으면 null)이 온다
        if (result.anonymousId) saveAnonymousId(result.anonymousId);
        return result;
      },
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: onboardingKeys.bootstrap() }),
      // 처리방침이 바뀌어 보낸 버전이 거절됐다. 포커스·재연결 재조회를 꺼 두어 캐시의 옛 버전이 남으므로,
      // bootstrap을 다시 불러 다음 동의가 새 버전을 보내게 한다
      onError: (error) => {
        if (
          error instanceof ApiError &&
          error.code === "POLICY_VERSION_CONFLICT"
        )
          return queryClient.invalidateQueries({
            queryKey: onboardingKeys.bootstrap(),
          });
      },
    }),
  /** 보낼 정책 버전의 출처는 아직 정해지지 않아 호출자가 넘긴다(API 작업 플랜 「남은 질문」) */
  agreeHealth: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: { policyVersion: string; agreedItems?: string[] }) =>
        postHealthConsent(api, input),
      onSuccess: (healthConsent) => {
        queryClient.setQueryData(onboardingKeys.healthConsent(), healthConsent);
        return queryClient.invalidateQueries({
          queryKey: onboardingKeys.bootstrap(),
        });
      },
    }),
  revokeHealth: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: () => deleteHealthConsent(api),
      onSuccess: (healthConsent) => {
        queryClient.setQueryData(onboardingKeys.healthConsent(), healthConsent);
        // 목표가 GENERAL로 돌아가 등급이 바뀐다
        return Promise.all([
          queryClient.invalidateQueries({
            queryKey: onboardingKeys.bootstrap(),
          }),
          queryClient.invalidateQueries({ queryKey: productKeys.all }),
        ]);
      },
    }),
  complete: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (body?: OnboardingCompleteRequestDto) =>
        postOnboardingComplete(api, body),
      onSuccess: (result) => {
        if (!result.persisted) rememberOnboardingCompleted();
        return queryClient.invalidateQueries({
          queryKey: onboardingKeys.bootstrap(),
        });
      },
    }),
};

export function useAgreePrivacy() {
  return useMutation(onboardingMutations.agreePrivacy(useQueryClient()));
}

export function useAgreeHealth() {
  return useMutation(onboardingMutations.agreeHealth(useQueryClient()));
}

export function useRevokeHealth() {
  return useMutation(onboardingMutations.revokeHealth(useQueryClient()));
}

export function useCompleteOnboarding() {
  return useMutation(onboardingMutations.complete(useQueryClient()));
}
