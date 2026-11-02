import { NextRequest } from "next/server";
// 문서는 unstable_doesProxyMatch라고 하지만 next 16.4.3은 예전 이름으로만 내보낸다
import { unstable_doesMiddlewareMatch as doesProxyMatch } from "next/experimental/testing/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IDENTITY_COOKIES } from "@/lib/api/identity";
import { requestRefresh } from "@/lib/api/refresh";
import { config, proxy } from "@/proxy";
import { jwtExpiringIn } from "@/test/http";

vi.mock("@/lib/api/refresh", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/refresh")>()),
  requestRefresh: vi.fn(),
}));

const mockedRefresh = vi.mocked(requestRefresh);

function requestWith(
  cookies: Record<string, string>,
  origin = "https://nuti.example",
) {
  const request = new NextRequest(`${origin}/product/1`);
  for (const [name, value] of Object.entries(cookies))
    request.cookies.set(name, value);
  return request;
}

// NextResponse.next({ request: { headers } })가 서버 렌더로 넘기는 요청 헤더
function forwardedCookie(response: Response) {
  return response.headers.get("x-middleware-request-cookie");
}

describe("proxy matcher", () => {
  it("상세 페이지 이동만 거친다", () => {
    expect(doesProxyMatch({ config, url: "/product/1" })).toBe(true);
    expect(
      doesProxyMatch({
        config,
        url: "/product/1?_rsc=abc",
        headers: { rsc: "1" },
      }),
    ).toBe(true);
    expect(doesProxyMatch({ config, url: "/home" })).toBe(false);
    expect(doesProxyMatch({ config, url: "/api/products/1" })).toBe(false);
    expect(doesProxyMatch({ config, url: "/product/1/extra" })).toBe(false);
  });

  it("프리페치는 거치지 않는다", () => {
    expect(
      doesProxyMatch({
        config,
        url: "/product/1",
        headers: { "next-router-prefetch": "1" },
      }),
    ).toBe(false);
    expect(
      doesProxyMatch({
        config,
        url: "/product/1",
        headers: { purpose: "prefetch" },
      }),
    ).toBe(false);
  });
});

describe("proxy", () => {
  beforeEach(() => {
    mockedRefresh.mockReset();
  });

  it("만료가 멀면 갱신하지 않는다", async () => {
    const response = await proxy(
      requestWith({
        [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
        [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      }),
    );
    expect(mockedRefresh).not.toHaveBeenCalled();
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("비로그인이면 갱신하지 않는다", async () => {
    await proxy(requestWith({ [IDENTITY_COOKIES.anonymousId]: "anon-1" }));
    expect(mockedRefresh).not.toHaveBeenCalled();
  });

  it("곧 만료되면 갱신해 응답 Set-Cookie와 렌더로 넘기는 요청 쿠키 양쪽에 넣는다", async () => {
    const fresh = jwtExpiringIn(600_000);
    mockedRefresh.mockResolvedValue({
      accessToken: fresh,
      refreshToken: "refresh-2",
    });

    const response = await proxy(
      requestWith({
        [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(10_000),
        [IDENTITY_COOKIES.refreshToken]: "refresh-1",
        [IDENTITY_COOKIES.anonymousId]: "anon-1",
      }),
    );

    expect(mockedRefresh).toHaveBeenCalledWith(expect.anything(), "refresh-1");
    const attributes = {
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      secure: true,
    };
    expect(response.cookies.get(IDENTITY_COOKIES.accessToken)).toMatchObject({
      value: fresh,
      ...attributes,
    });
    expect(response.cookies.get(IDENTITY_COOKIES.refreshToken)).toMatchObject({
      value: "refresh-2",
      ...attributes,
    });
    const cookie = forwardedCookie(response);
    expect(cookie).toContain(`${IDENTITY_COOKIES.accessToken}=${fresh}`);
    expect(cookie).toContain(`${IDENTITY_COOKIES.refreshToken}=refresh-2`);
    expect(cookie).toContain(`${IDENTITY_COOKIES.anonymousId}=anon-1`);
  });

  it("HTTP로 들어온 요청에는 Secure를 붙이지 않는다", async () => {
    mockedRefresh.mockResolvedValue({
      accessToken: jwtExpiringIn(600_000),
      refreshToken: "refresh-2",
    });

    const response = await proxy(
      requestWith(
        { [IDENTITY_COOKIES.refreshToken]: "refresh-1" },
        "http://localhost:3000",
      ),
    );

    expect(
      response.cookies.get(IDENTITY_COOKIES.refreshToken)?.secure,
    ).toBeFalsy();
    expect(response.headers.get("set-cookie")).not.toMatch(/secure/i);
  });

  it("갱신에 실패하면 쿠키를 건드리지 않고 그대로 통과시킨다", async () => {
    mockedRefresh.mockRejectedValue(new Error("INVALID_TOKEN"));

    const response = await proxy(
      requestWith({
        [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(-1_000),
        [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      }),
    );

    expect(response.headers.has("set-cookie")).toBe(false);
    expect(forwardedCookie(response)).toBeNull();
  });
});
