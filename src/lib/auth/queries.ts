import {
  mutationOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { rotateAnonymousId, saveTokens } from "@/lib/api/identity";
import { consentItemKeys } from "@/lib/consent/keys";
import { clearDeviceGoal, readDeviceGoal } from "@/lib/goal/device";
import { forgetOnboardingCompleted } from "@/lib/onboarding/storage";
import { applyAccountGoal } from "@/lib/goal/queries";
import { clearTokensAfterRefresh } from "@/lib/api/refresh";
import { postLogout, postOAuthLogin, postSignup } from "@/lib/auth/api";
import { toLoginResult, toSignedIn } from "@/lib/auth/mapper";
import {
  broadcastSession,
  invalidateUserQueries,
  resetUserQueries,
} from "@/lib/auth/session";
import type {
  OAuthLoginRequestDto,
  SignedInTokenDto,
  SignupInput,
} from "@/lib/auth/types";
import { deleteUser } from "@/lib/me/api";

// 조회 API가 없어 쿼리 키를 두지 않는다

/** 로그아웃·탈퇴 뒤 이 기기의 세션을 끝낸다. 익명 ID도 새로 만들어 이전 기록과 끊는다 */
async function endSession(queryClient: QueryClient) {
  await clearTokensAfterRefresh(rotateAnonymousId);
  broadcastSession("logout");
  return resetUserQueries(queryClient);
}

/** 토큰을 받은 응답(가입한 계정·가입 완료)을 저장하고 화면 모델로 바꾼다 */
function signIn(dto: SignedInTokenDto) {
  saveTokens({ accessToken: dto.accessToken, refreshToken: dto.refreshToken });
  // 익명 ID는 그대로 둔다. 서버가 기록 병합에 실패하면 다음 로그인 때 같은 ID로 다시 옮긴다
  return toSignedIn(dto);
}

/** 로그인·가입이 끝난 뒤. 다른 탭에 알리고 사용자 조회를 다시 부른 뒤 계정 목표로 기기 목표를 맞춘다 */
async function afterSignIn(queryClient: QueryClient) {
  broadcastSession("login");
  await invalidateUserQueries(queryClient);
  // 목표를 못 맞춰도 로그인은 끝난다. 기기 목표로 계속 본다
  await applyAccountGoal(queryClient).catch(() => undefined);
}

// 서버가 이 토큰을 이미 로그인으로 보지 않는다(다른 기기에서 탈퇴해 비활성인 계정, 갱신이 거절된 직후).
// 다시 보내도 같은 401이라 이 기기만 정리한다
function isSessionGone(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export const authMutations = {
  /**
   * `code`·`provider`는 백엔드 OAuth 콜백이 프론트 경로로 넘긴 값이다. 처음 로그인이면 토큰이 없어 저장하지
   * 않고 `SIGNUP_REQUIRED`(가입 토큰·회사 계정 정보)를 돌려준다. 화면은 5-6 가입 동의로 보낸다
   */
  login: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: async (body: OAuthLoginRequestDto) => {
        const dto = await postOAuthLogin(api, body);
        return dto.signupRequired ? toLoginResult(dto) : signIn(dto);
      },
      onSuccess: (result) => {
        if (result.status === "SIGNED_IN") return afterSignIn(queryClient);
      },
    }),
  /**
   * 5-6 「동의하고 시작하기」. 「목표 계정 저장」에 동의했으면 5-6c에서 기기에 저장한 목표를 함께 보내 계정에도
   * 저장되게 한다. 건강 목표는 민감정보라 동의하지 않았으면 보내지 않는다(v3 기능명세 ONB_004). 약관·처리방침
   * 판이 바뀌어 거절되면 가입 동의 항목을 다시 불러 새 판을 보이게 한다
   */
  signup: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: async (input: SignupInput) => {
        const dto = await postSignup(api, {
          ...input,
          goal: input.agreements.GOAL_ACCOUNT
            ? (readDeviceGoal() ?? undefined)
            : undefined,
        });
        return signIn(dto);
      },
      onSuccess: () => afterSignIn(queryClient),
      onError: (error) => {
        if (
          error instanceof ApiError &&
          error.code === "POLICY_VERSION_CONFLICT"
        )
          return queryClient.invalidateQueries({
            queryKey: consentItemKeys.all(),
          });
      },
    }),
  /** 네트워크·5xx로 실패하면 쿠키를 그대로 둔다. 서버의 토큰이 남아 있어 로그인 상태로 다시 시도하게 한다 */
  logout: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: () => postLogout(api),
      onSuccess: () => endSession(queryClient),
      onError: (error) => {
        if (isSessionGone(error)) return endSession(queryClient);
      },
    }),
  /**
   * 화면 진입점이 정해지지 않아 훅은 두지 않는다. 기기는 처음 방문 상태로 돌아가야 해(ACCT_008) 익명 ID를
   * 새로 만들고 기기 목표와 온보딩 완료 기록도 지운다
   */
  withdraw: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: () => deleteUser(api),
      onSuccess: () => {
        clearDeviceGoal();
        forgetOnboardingCompleted();
        return endSession(queryClient);
      },
      onError: (error) => {
        if (!isSessionGone(error)) return;
        // 계정이 이미 없거나 세션이 끝나 서버에서 지우지 못했어도 사용자는 탈퇴를 골랐다. 이 기기는 처음
        // 방문 상태로 돌린다
        clearDeviceGoal();
        forgetOnboardingCompleted();
        return endSession(queryClient);
      },
    }),
};

export function useLogin() {
  return useMutation(authMutations.login(useQueryClient()));
}

export function useSignup() {
  return useMutation(authMutations.signup(useQueryClient()));
}

export function useLogout() {
  return useMutation(authMutations.logout(useQueryClient()));
}
