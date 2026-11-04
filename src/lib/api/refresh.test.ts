import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, toApiError } from "@/lib/api/errors";
import { IDENTITY_COOKIES } from "@/lib/api/identity";
import {
  getFreshAccessToken,
  isExpiringSoon,
  needsRefresh,
  onSessionExpired,
} from "@/lib/api/refresh";
import { stubDocumentCookie, stubWebLocks } from "@/test/browser";
import {
  failure,
  jwt,
  jwtExpiringIn,
  mockAdapter,
  success,
  type Reply,
} from "@/test/http";

function refreshHttp(handler: () => Reply | Promise<Reply>) {
  const { adapter, requests } = mockAdapter(handler);
  const http = axios.create({ adapter });
  http.interceptors.response.use(undefined, (error) =>
    Promise.reject(toApiError(error)),
  );
  return { http, requests };
}

describe("isExpiringSoon", () => {
  const now = Date.UTC(2026, 10, 2);

  it("만료 60초 전부터 갱신 대상이다", () => {
    expect(isExpiringSoon(jwt(now / 1000 + 61), now)).toBe(false);
    expect(isExpiringSoon(jwt(now / 1000 + 60), now)).toBe(true);
    expect(isExpiringSoon(jwt(now / 1000 - 1), now)).toBe(true);
  });

  it("exp를 읽을 수 없는 토큰도 갱신 대상이다", () => {
    expect(isExpiringSoon("not-a-jwt", now)).toBe(true);
    expect(isExpiringSoon("a.%%%.c", now)).toBe(true);
    const noExp = Buffer.from('{"sub":"1"}').toString("base64url");
    expect(isExpiringSoon(`a.${noExp}.c`, now)).toBe(true);
  });
});

describe("needsRefresh", () => {
  it("refresh 토큰이 없으면 갱신하지 않는다", () => {
    expect(needsRefresh({ accessToken: null, refreshToken: null })).toBe(false);
  });

  it("액세스 토큰이 없거나 곧 만료되면 갱신한다", () => {
    expect(needsRefresh({ accessToken: null, refreshToken: "r" })).toBe(true);
    expect(
      needsRefresh({ accessToken: jwtExpiringIn(30_000), refreshToken: "r" }),
    ).toBe(true);
    expect(
      needsRefresh({ accessToken: jwtExpiringIn(600_000), refreshToken: "r" }),
    ).toBe(false);
  });
});

describe("getFreshAccessToken", () => {
  beforeEach(() => {
    stubWebLocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("만료가 멀면 갱신 없이 쿠키의 토큰을 쓴다", async () => {
    const accessToken = jwtExpiringIn(600_000);
    stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: accessToken,
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
    });
    const { http, requests } = refreshHttp(() => success());
    await expect(getFreshAccessToken(http)).resolves.toBe(accessToken);
    expect(requests).toHaveLength(0);
  });

  it("비로그인이면 null이다", async () => {
    stubDocumentCookie();
    const { http, requests } = refreshHttp(() => success());
    await expect(getFreshAccessToken(http)).resolves.toBeNull();
    expect(requests).toHaveLength(0);
  });

  it("곧 만료되면 갱신하고 새 토큰 쌍을 둘 다 저장한다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(10_000),
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
    });
    const fresh = jwtExpiringIn(600_000);
    const { http, requests } = refreshHttp(() =>
      success({ accessToken: fresh, refreshToken: "refresh-2" }),
    );

    await expect(getFreshAccessToken(http)).resolves.toBe(fresh);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("/auth/refresh");
    expect(JSON.parse(requests[0].data as string)).toEqual({
      refreshToken: "refresh-1",
    });
    expect(cookies.get(IDENTITY_COOKIES.accessToken)).toBe(fresh);
    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBe("refresh-2");
  });

  it("같은 탭의 동시 요청은 갱신 한 번을 기다린다", async () => {
    stubDocumentCookie({ [IDENTITY_COOKIES.refreshToken]: "refresh-1" });
    const fresh = jwtExpiringIn(600_000);
    const { http, requests } = refreshHttp(() =>
      success({ accessToken: fresh, refreshToken: "refresh-2" }),
    );

    const results = await Promise.all([
      getFreshAccessToken(http),
      getFreshAccessToken(http),
      getFreshAccessToken(http),
    ]);
    expect(results).toEqual([fresh, fresh, fresh]);
    expect(requests).toHaveLength(1);
  });

  it("락을 기다리는 동안 다른 탭이 갱신했으면 그 토큰을 쓴다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
    });
    const otherTab = jwtExpiringIn(600_000);
    let release = () => {};
    vi.stubGlobal("navigator", {
      locks: {
        request: async (_name: string, callback: () => Promise<unknown>) => {
          await new Promise<void>((resolve) => (release = resolve));
          return callback();
        },
      },
    });
    const { http, requests } = refreshHttp(() => success());

    const pending = getFreshAccessToken(http);
    document.cookie = `${IDENTITY_COOKIES.accessToken}=${otherTab}; Path=/`;
    document.cookie = `${IDENTITY_COOKIES.refreshToken}=refresh-2; Path=/`;
    release();

    await expect(pending).resolves.toBe(otherTab);
    expect(requests).toHaveLength(0);
    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBe("refresh-2");
  });

  it.each(["TOKEN_EXPIRED", "INVALID_TOKEN"])(
    "갱신이 %s로 거절되면 토큰과 익명 ID를 지우고 null이다",
    async (code) => {
      const cookies = stubDocumentCookie({
        [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(-1_000),
        [IDENTITY_COOKIES.refreshToken]: "refresh-1",
        [IDENTITY_COOKIES.anonymousId]: "anon-1",
        [IDENTITY_COOKIES.sessionId]: "session-1",
      });
      const { http } = refreshHttp(() => failure(401, code));

      await expect(getFreshAccessToken(http)).resolves.toBeNull();
      expect(cookies.get(IDENTITY_COOKIES.accessToken)).toBeUndefined();
      expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBeUndefined();
      expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBeUndefined();
      expect(cookies.get(IDENTITY_COOKIES.sessionId)).toBe("session-1");
    },
  );

  it("갱신 중 proxy가 refresh 토큰을 교체해 거절되면 지우지 않고 새 토큰을 쓴다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(-1_000),
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      [IDENTITY_COOKIES.anonymousId]: "anon-1",
    });
    const byProxy = jwtExpiringIn(600_000);
    const { http } = refreshHttp(() => {
      // 브라우저 요청이 서버에 닿기 전에 proxy 응답의 Set-Cookie가 먼저 적용됐다
      document.cookie = `${IDENTITY_COOKIES.accessToken}=${byProxy}; Path=/`;
      document.cookie = `${IDENTITY_COOKIES.refreshToken}=refresh-2; Path=/`;
      return failure(401, "INVALID_TOKEN");
    });

    await expect(getFreshAccessToken(http)).resolves.toBe(byProxy);
    expect(cookies.get(IDENTITY_COOKIES.accessToken)).toBe(byProxy);
    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBe("refresh-2");
    expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBe("anon-1");
  });

  it("네트워크 오류·5xx면 쿠키를 남기고 그 오류로 실패한다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      [IDENTITY_COOKIES.anonymousId]: "anon-1",
    });
    const { http } = refreshHttp(() => failure(503, "INTERNAL_SERVER_ERROR"));

    const error = await getFreshAccessToken(http).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 503 });
    expect(cookies.get(IDENTITY_COOKIES.refreshToken)).toBe("refresh-1");
    expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBe("anon-1");
  });

  it("실패한 갱신을 공유하지 않고 다음 요청은 다시 갱신한다", async () => {
    stubDocumentCookie({ [IDENTITY_COOKIES.refreshToken]: "refresh-1" });
    const fresh = jwtExpiringIn(600_000);
    const replies = [
      failure(503, "INTERNAL_SERVER_ERROR"),
      success({ accessToken: fresh, refreshToken: "refresh-2" }),
    ];
    const { http, requests } = refreshHttp(() => replies.shift()!);

    await expect(getFreshAccessToken(http)).rejects.toBeInstanceOf(ApiError);
    await expect(getFreshAccessToken(http)).resolves.toBe(fresh);
    expect(requests).toHaveLength(2);
  });

  it("갱신이 거절돼 토큰을 지우면 세션 만료를 알리고, 5xx면 알리지 않는다", async () => {
    stubDocumentCookie({ [IDENTITY_COOKIES.refreshToken]: "refresh-1" });
    const listener = vi.fn();
    const release = onSessionExpired(listener);

    await getFreshAccessToken(
      refreshHttp(() => failure(503, "INTERNAL_SERVER_ERROR")).http,
    ).catch(() => undefined);
    expect(listener).not.toHaveBeenCalled();

    await getFreshAccessToken(
      refreshHttp(() => failure(401, "TOKEN_EXPIRED")).http,
    );
    expect(listener).toHaveBeenCalledOnce();

    release();
  });
});
