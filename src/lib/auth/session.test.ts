import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toApiError } from "@/lib/api/errors";
import { IDENTITY_COOKIES, subscribeTokens } from "@/lib/api/identity";
import { getFreshAccessToken } from "@/lib/api/refresh";
import { connectSession } from "@/lib/auth/session";
import { metaKeys } from "@/lib/me/keys";
import { savedKeys } from "@/lib/saved/keys";
import {
  stubBroadcastChannel,
  stubDocumentCookie,
  stubWebLocks,
} from "@/test/browser";
import { failure, mockAdapter } from "@/test/http";

describe("connectSession", () => {
  let queryClient: QueryClient;
  let channel: ReturnType<typeof stubBroadcastChannel>;
  let disconnect: () => void;

  beforeEach(() => {
    stubWebLocks();
    channel = stubBroadcastChannel();
    queryClient = new QueryClient();
    queryClient.setQueryData(savedKeys.list(), { pages: [], pageParams: [] });
    queryClient.setQueryData(metaKeys.policies(), { privacy: null });
    disconnect = connectSession(queryClient);
  });
  afterEach(() => {
    disconnect();
    vi.unstubAllGlobals();
  });

  it("다른 탭이 로그아웃하면 사용자 캐시를 비우고 로그인 상태 구독자를 깨운다", () => {
    const listener = vi.fn();
    const release = subscribeTokens(listener);

    channel.fromOtherTab("nuti-session", "logout");

    expect(queryClient.getQueryData(savedKeys.list())).toBeUndefined();
    expect(queryClient.getQueryData(metaKeys.policies())).toEqual({
      privacy: null,
    });
    expect(listener).toHaveBeenCalledOnce();
    release();
  });

  it("다른 탭이 로그인하면 사용자 조회를 다시 부른다", () => {
    channel.fromOtherTab("nuti-session", "login");
    expect(queryClient.getQueryState(savedKeys.list())?.isInvalidated).toBe(
      true,
    );
  });

  it("이 탭의 세션이 만료되면 캐시를 비우고 다른 탭에 알린다", async () => {
    stubDocumentCookie({ [IDENTITY_COOKIES.refreshToken]: "refresh-1" });
    const http = axios.create({
      adapter: mockAdapter(() => failure(401, "TOKEN_EXPIRED")).adapter,
    });
    http.interceptors.response.use(undefined, (error) =>
      Promise.reject(toApiError(error)),
    );

    await getFreshAccessToken(http);

    expect(queryClient.getQueryData(savedKeys.list())).toBeUndefined();
    expect(channel.posted).toEqual([{ name: "nuti-session", data: "logout" }]);
  });

  it("해제하면 더 받지 않는다", () => {
    disconnect();
    channel.fromOtherTab("nuti-session", "logout");
    expect(queryClient.getQueryData(savedKeys.list())).toBeDefined();
    disconnect = () => {};
  });
});
