import { afterEach, describe, expect, it, vi } from "vitest";
import { IDENTITY_COOKIES } from "@/lib/api/identity";
import { serverApi } from "@/lib/api/server";
import { ApiError } from "@/lib/api/errors";
import { failure, mockAdapter, success, type Reply } from "@/test/http";

const requestCookies = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = requestCookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
  }),
}));

const originalAdapter = serverApi.defaults.adapter;

function useAdapter(handler: () => Reply = () => success()) {
  const mock = mockAdapter(handler);
  serverApi.defaults.adapter = mock.adapter;
  return mock;
}

describe("serverApi", () => {
  afterEach(() => {
    serverApi.defaults.adapter = originalAdapter;
  });

  it("요청 쿠키의 토큰·익명 ID·세션 ID를 헤더에 붙인다", async () => {
    requestCookies.clear();
    requestCookies.set(IDENTITY_COOKIES.accessToken, "access-1");
    requestCookies.set(IDENTITY_COOKIES.anonymousId, "anon-1");
    requestCookies.set(IDENTITY_COOKIES.sessionId, "session-1");
    const { requests } = useAdapter();

    await serverApi.get("/products/1");
    const headers = requests[0].headers;
    expect(headers.get("Authorization")).toBe("Bearer access-1");
    expect(headers.get("X-Anonymous-Id")).toBe("anon-1");
    expect(headers.get("X-Session-Id")).toBe("session-1");
  });

  it("쿠키가 없으면 헤더를 빼고 보낸다. 세션 ID도 만들지 않는다", async () => {
    requestCookies.clear();
    const { requests } = useAdapter();

    await serverApi.get("/products/1");
    const headers = requests[0].headers;
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.has("X-Anonymous-Id")).toBe(false);
    expect(headers.has("X-Session-Id")).toBe(false);
  });

  it("실패는 ApiError로 reject한다", async () => {
    requestCookies.clear();
    useAdapter(() => failure(404, "PRODUCT_NOT_FOUND"));

    await expect(serverApi.get("/products/x")).rejects.toBeInstanceOf(ApiError);
  });
});
