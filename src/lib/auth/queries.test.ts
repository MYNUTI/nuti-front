import {
  MutationObserver,
  QueryClient,
  type MutationObserverOptions,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { IDENTITY_COOKIES } from "@/lib/api/identity";
import { DEVICE_GOAL_COOKIE } from "@/lib/goal/device";
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
import { failure, jwtExpiringIn, mockAdapter, success } from "@/test/http";

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
    queryClient.setQueryData(savedKeys.list("WEIGHT_LOSS"), {
      pages: [],
      pageParams: [],
    });
    queryClient.setQueryData(onboardingKeys.bootstrap(), { isLoggedIn: true });
    queryClient.setQueryData(metaKeys.policies(), { privacy: null });
    queryClient.setQueryData(searchKeys.popularKeywords(), []);
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  function reply(handler: Parameters<typeof mockAdapter>[0]) {
    const mock = mockAdapter(handler);
    api.defaults.adapter = mock.adapter;
    return mock;
  }

  it("로그인은 익명 ID를 보내 병합하고, 토큰을 저장한 뒤 사용자 조회를 다시 부른다. 익명 ID는 그대로 둔다", async () => {
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
    // 서버가 병합에 실패하면 다음 로그인 때 같은 익명 ID로 다시 옮긴다
    expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBe("anon-1");
    expect(
      queryClient.getQueryState(savedKeys.list("WEIGHT_LOSS"))?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(metaKeys.policies())?.isInvalidated).toBe(
      false,
    );
    expect(channel.posted).toEqual([{ name: "nuti-session", data: "login" }]);
  });

  it("로그인 뒤 동의하고 계정에 저장한 목표가 있으면 기기 목표를 맞춘다", async () => {
    const cookies = stubDocumentCookie({ [DEVICE_GOAL_COOKIE]: "WEIGHT_LOSS" });
    reply(() =>
      success({
        accessToken: jwtExpiringIn(600_000),
        refreshToken: "refresh-1",
        newUser: false,
        goal: "MUSCLE_GAIN",
        label: "근육 증가",
        goalAccountConsented: true,
        appliedAt: "2026-11-20T10:00:00",
      }),
    );

    await run(authMutations.login(queryClient), queryClient, {
      provider: "KAKAO",
      code: "code-1",
    });
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBe("MUSCLE_GAIN");
  });

  it("로그인 뒤 계정 목표를 못 받아도 로그인은 끝나고 기기 목표를 그대로 둔다", async () => {
    const cookies = stubDocumentCookie({ [DEVICE_GOAL_COOKIE]: "WEIGHT_LOSS" });
    const accessToken = jwtExpiringIn(600_000);
    reply((config) =>
      config.url === "/auth/oauth"
        ? success({ accessToken, refreshToken: "refresh-1", newUser: false })
        : failure(503, "INTERNAL_SERVER_ERROR"),
    );

    await expect(
      run(authMutations.login(queryClient), queryClient, {
        provider: "KAKAO",
        code: "code-1",
      }),
    ).resolves.toMatchObject({ newUser: false });
    expect(cookies.get(IDENTITY_COOKIES.accessToken)).toBe(accessToken);
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBe("WEIGHT_LOSS");
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
    expect(
      queryClient.getQueryData(savedKeys.list("WEIGHT_LOSS")),
    ).toBeDefined();
    expect(channel.posted).toEqual([]);
  });

  it("로그아웃은 토큰을 지우고 익명 ID를 새로 만든 뒤 사용자 캐시만 비운다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      [IDENTITY_COOKIES.anonymousId]: "anon-1",
    });
    reply(() => success(null));

    await run(authMutations.logout(queryClient), queryClient, undefined);

    expect(cookies.get(IDENTITY_COOKIES.accessToken)).toBeUndefined();
    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBeUndefined();
    const anonymousId = cookies.get(IDENTITY_COOKIES.anonymousId);
    expect(anonymousId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(anonymousId).not.toBe("anon-1");
    expect(
      queryClient.getQueryData(savedKeys.list("WEIGHT_LOSS")),
    ).toBeUndefined();
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
      expect(cookies.get(IDENTITY_COOKIES.anonymousId)).not.toBe("anon-1");
      expect(
        queryClient.getQueryData(savedKeys.list("WEIGHT_LOSS")),
      ).toBeUndefined();
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
    expect(
      queryClient.getQueryData(savedKeys.list("WEIGHT_LOSS")),
    ).toBeDefined();
    expect(channel.posted).toEqual([]);
  });

  it("탈퇴는 사유를 query로 보내고 토큰을 지운 뒤 익명 ID를 새로 만든다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      [IDENTITY_COOKIES.anonymousId]: "anon-1",
    });
    const { requests } = reply(() => success());

    await run(authMutations.withdraw(queryClient), queryClient, "안 써요");

    expect(requests[0]).toMatchObject({ method: "delete", url: "/users/me" });
    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBeUndefined();
    const anonymousId = cookies.get(IDENTITY_COOKIES.anonymousId);
    expect(anonymousId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(anonymousId).not.toBe("anon-1");
    expect(
      queryClient.getQueryData(savedKeys.list("WEIGHT_LOSS")),
    ).toBeUndefined();
  });

  it("탈퇴하면 기기 목표도 지워 처음 방문 상태로 돌린다. 로그아웃은 남긴다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      [DEVICE_GOAL_COOKIE]: "MUSCLE_GAIN",
    });
    reply(() => success(null));

    await run(authMutations.logout(queryClient), queryClient, undefined);
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBe("MUSCLE_GAIN");

    await run(authMutations.withdraw(queryClient), queryClient, undefined);
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBeUndefined();
  });

  it("탈퇴가 401이어도 이 기기는 처음 방문 상태로 돌린다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      [DEVICE_GOAL_COOKIE]: "MUSCLE_GAIN",
    });
    reply(() => failure(401, "UNAUTHORIZED"));

    await run(
      authMutations.withdraw(queryClient),
      queryClient,
      undefined,
    ).catch(() => undefined);
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBeUndefined();
  });
});
