import {
  mutationOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { rotateAnonymousId, saveTokens } from "@/lib/api/identity";
import { clearDeviceGoal } from "@/lib/goal/device";
import { applyAccountGoal } from "@/lib/goal/queries";
import { clearTokensAfterRefresh } from "@/lib/api/refresh";
import { postLogout, postOAuthLogin } from "@/lib/auth/api";
import { toLoginResult } from "@/lib/auth/mapper";
import {
  broadcastSession,
  invalidateUserQueries,
  resetUserQueries,
} from "@/lib/auth/session";
import type { OAuthLoginRequestDto } from "@/lib/auth/types";
import { deleteUser } from "@/lib/me/api";

// 조회 API가 없어 쿼리 키를 두지 않는다

/** 로그아웃·탈퇴 뒤 이 기기의 세션을 끝낸다. 익명 ID도 새로 만들어 이전 기록과 끊는다 */
async function endSession(queryClient: QueryClient) {
  await clearTokensAfterRefresh(rotateAnonymousId);
  broadcastSession("logout");
  return resetUserQueries(queryClient);
}

// 서버가 이 토큰을 이미 로그인으로 보지 않는다(다른 기기에서 탈퇴해 비활성인 계정, 갱신이 거절된 직후).
// 다시 보내도 같은 401이라 이 기기만 정리한다
function isSessionGone(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export const authMutations = {
  /** `code`·`provider`는 백엔드 OAuth 콜백이 프론트 경로로 넘긴 값이다 */
  login: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: async (body: OAuthLoginRequestDto) => {
        const dto = await postOAuthLogin(api, body);
        saveTokens({
          accessToken: dto.accessToken,
          refreshToken: dto.refreshToken,
        });
        // 익명 ID는 그대로 둔다. 서버가 기록 병합에 실패하면 다음 로그인 때 같은 ID로 다시 옮긴다
        return toLoginResult(dto);
      },
      onSuccess: async () => {
        broadcastSession("login");
        await invalidateUserQueries(queryClient);
        // 목표를 못 맞춰도 로그인은 끝난다. 기기 목표로 계속 본다
        await applyAccountGoal(queryClient).catch(() => undefined);
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
   * 새로 만들고 기기 목표도 지운다
   */
  withdraw: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: () => deleteUser(api),
      onSuccess: () => {
        clearDeviceGoal();
        return endSession(queryClient);
      },
      onError: (error) => {
        if (!isSessionGone(error)) return;
        // 계정이 이미 없거나 세션이 끝나 서버에서 지우지 못했어도 사용자는 탈퇴를 골랐다. 이 기기는 처음
        // 방문 상태로 돌린다
        clearDeviceGoal();
        return endSession(queryClient);
      },
    }),
};

export function useLogin() {
  return useMutation(authMutations.login(useQueryClient()));
}

export function useLogout() {
  return useMutation(authMutations.logout(useQueryClient()));
}
