import {
  MutationObserver,
  QueryClient,
  type MutationObserverOptions,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { IDENTITY_COOKIES } from "@/lib/api/identity";
import { authMutations } from "@/lib/auth/queries";
import { metaKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { savedKeys } from "@/lib/saved/keys";
import { searchKeys } from "@/lib/search/keys";
import {
  stubBroadcastChannel,
  stubDocumentCookie,
  stubWebLocks,
} from "@/test/browser";
import {
  failure,
  jwtExpiringIn,
  mockAdapter,
  success,
  type Reply,
} from "@/test/http";

const originalAdapter = api.defaults.adapter;

function run<TData, TVariables>(
  options: MutationObserverOptions<TData, Error, TVariables>,
  queryClient: QueryClient,
  variables: TVariables,
) {
  return new MutationObserver(queryClient, options).mutate(variables);
}

describe("authMutations", () => {
  let queryClient: QueryClient;
  let channel: ReturnType<typeof stubBroadcastChannel>;

  beforeEach(() => {
    stubWebLocks();
    channel = stubBroadcastChannel();
    queryClient = new QueryClient();
    queryClient.setQueryData(savedKeys.list(), { pages: [], pageParams: [] });
    queryClient.setQueryData(onboardingKeys.bootstrap(), { isLoggedIn: true });
    queryClient.setQueryData(metaKeys.policies(), { privacy: null });
    queryClient.setQueryData(searchKeys.popularKeywords(), []);
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  function reply(handler: () => Reply) {
    const mock = mockAdapter(handler);
    api.defaults.adapter = mock.adapter;
    return mock;
  }

  it("로그인은 익명 ID를 보내 병합하고, 토큰을 저장하고 익명 ID를 지운 뒤 사용자 조회를 다시 부른다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.anonymousId]: "anon-1",
    });
    const accessToken = jwtExpiringIn(600_000);
    const { requests } = reply(() =>
      success({
        accessToken,
        refreshToken: "refresh-1",
        newUser: false,
        mergedRecordCount: 3,
      }),
    );

    await expect(
      run(authMutations.login(queryClient), queryClient, {
        provider: "KAKAO",
        code: "code-1",
      }),
    ).resolves.toMatchObject({ mergedRecordCount: 3, user: null });

    expect(requests[0]).toMatchObject({ method: "post", url: "/auth/oauth" });
    expect(requests[0].headers.get("X-Anonymous-Id")).toBe("anon-1");
    expect(cookies.get(IDENTITY_COOKIES.accessToken)).toBe(accessToken);
    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBe("refresh-1");
    expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBeUndefined();
    expect(queryClient.getQueryState(savedKeys.list())?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(metaKeys.policies())?.isInvalidated).toBe(
      false,
    );
    expect(channel.posted).toEqual([{ name: "nuti-session", data: "login" }]);
  });

  it("로그인이 실패하면 토큰을 저장하지 않고 익명 ID를 남긴다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.anonymousId]: "anon-1",
    });
    reply(() => failure(401, "LOGIN_FAILED"));

    await run(authMutations.login(queryClient), queryClient, {
      provider: "KAKAO",
      code: "code-1",
    }).catch(() => undefined);

    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBeUndefined();
    expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBe("anon-1");
    expect(queryClient.getQueryData(savedKeys.list())).toBeDefined();
    expect(channel.posted).toEqual([]);
  });

  it("로그아웃은 토큰을 지우고 새 익명 ID를 저장한 뒤 사용자 캐시만 비운다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
    });
    reply(() => success({ anonymousId: "anon-2" }));

    await run(authMutations.logout(queryClient), queryClient, undefined);

    expect(cookies.get(IDENTITY_COOKIES.accessToken)).toBeUndefined();
    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBeUndefined();
    expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBe("anon-2");
    expect(queryClient.getQueryData(savedKeys.list())).toBeUndefined();
    expect(
      queryClient.getQueryData(onboardingKeys.bootstrap()),
    ).toBeUndefined();
    expect(queryClient.getQueryData(metaKeys.policies())).toEqual({
      privacy: null,
    });
    expect(queryClient.getQueryData(searchKeys.popularKeywords())).toEqual([]);
    expect(channel.posted).toEqual([{ name: "nuti-session", data: "logout" }]);
  });

  it.each(["logout", "withdraw"] as const)(
    "%s가 401이면 서버 세션이 이미 없어 이 기기만 정리한다",
    async (name) => {
      const cookies = stubDocumentCookie({
        [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
        [IDENTITY_COOKIES.refreshToken]: "refresh-1",
        [IDENTITY_COOKIES.anonymousId]: "anon-1",
      });
      reply(() => failure(401, "UNAUTHORIZED"));

      await run(
        authMutations[name](queryClient) as MutationObserverOptions<
          unknown,
          Error,
          undefined
        >,
        queryClient,
        undefined,
      ).catch(() => undefined);

      expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBeUndefined();
      expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBeUndefined();
      expect(queryClient.getQueryData(savedKeys.list())).toBeUndefined();
      expect(channel.posted).toEqual([
        { name: "nuti-session", data: "logout" },
      ]);
    },
  );

  it("로그아웃이 5xx로 실패하면 쿠키와 캐시를 그대로 둔다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
    });
    reply(() => failure(503, "INTERNAL_SERVER_ERROR"));

    await run(authMutations.logout(queryClient), queryClient, undefined).catch(
      () => undefined,
    );

    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBe("refresh-1");
    expect(queryClient.getQueryData(savedKeys.list())).toBeDefined();
    expect(channel.posted).toEqual([]);
  });

  it("탈퇴는 사유를 query로 보내고 토큰·익명 ID를 모두 지운다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      [IDENTITY_COOKIES.anonymousId]: "anon-1",
    });
    const { requests } = reply(() => success());

    await run(authMutations.withdraw(queryClient), queryClient, "안 써요");

    expect(requests[0]).toMatchObject({ method: "delete", url: "/users/me" });
    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBeUndefined();
    expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBeUndefined();
    expect(queryClient.getQueryData(savedKeys.list())).toBeUndefined();
  });
});
