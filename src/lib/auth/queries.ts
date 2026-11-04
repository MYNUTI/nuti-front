import {
  mutationOptions,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import {
  clearAnonymousId,
  saveAnonymousId,
  saveTokens,
} from "@/lib/api/identity";
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

/**
 * 로그아웃·탈퇴 뒤 이 기기의 세션을 끝낸다. 새 익명 ID를 받았으면 그것으로 바꾸고, 못 받았으면 지운다
 * (다시 쓰려면 개인정보 동의부터 받는다)
 */
async function endSession(queryClient: QueryClient, anonymousId?: string) {
  await clearTokensAfterRefresh(() =>
    anonymousId ? saveAnonymousId(anonymousId) : clearAnonymousId(),
  );
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
        // 보낸 익명 ID는 계정에 병합돼 서버가 더는 인정하지 않는다. 로그아웃하면 새로 받는다
        clearAnonymousId();
        return toLoginResult(dto);
      },
      onSuccess: () => {
        broadcastSession("login");
        return invalidateUserQueries(queryClient);
      },
    }),
  /** 네트워크·5xx로 실패하면 쿠키를 그대로 둔다. 서버의 토큰이 남아 있어 로그인 상태로 다시 시도하게 한다 */
  logout: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: () => postLogout(api),
      onSuccess: ({ anonymousId }) => endSession(queryClient, anonymousId),
      onError: (error) => {
        if (isSessionGone(error)) return endSession(queryClient);
      },
    }),
  /** 화면 진입점이 정해지지 않아 훅은 두지 않는다. 서버가 새 익명 ID를 주지 않아 익명 ID도 지운다 */
  withdraw: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (reason?: string) => deleteUser(api, reason),
      onSuccess: () => endSession(queryClient),
      onError: (error) => {
        if (isSessionGone(error)) return endSession(queryClient);
      },
    }),
};

export function useLogin() {
  return useMutation(authMutations.login(useQueryClient()));
}

export function useLogout() {
  return useMutation(authMutations.logout(useQueryClient()));
}
