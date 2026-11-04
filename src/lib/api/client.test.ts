import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { IDENTITY_COOKIES } from "@/lib/api/identity";
import { stubDocumentCookie, stubWebLocks } from "@/test/browser";
import {
  failure,
  jwtExpiringIn,
  mockAdapter,
  success,
  type Reply,
} from "@/test/http";

const originalAdapter = api.defaults.adapter;

function useAdapter(handler: () => Reply = () => success()) {
  const mock = mockAdapter(handler);
  api.defaults.adapter = mock.adapter;
  return mock;
}

describe("api (브라우저)", () => {
  beforeEach(() => {
    stubWebLocks();
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  it("쿠키의 토큰·익명 ID·세션 ID를 헤더에 붙인다", async () => {
    const accessToken = jwtExpiringIn(600_000);
    stubDocumentCookie({
      [IDENTITY_COOKIES.accessToken]: accessToken,
      [IDENTITY_COOKIES.refreshToken]: "refresh-1",
      [IDENTITY_COOKIES.anonymousId]: "anon-1",
      [IDENTITY_COOKIES.sessionId]: "session-1",
    });
    const { requests } = useAdapter();

    await api.get("/me/summary");
    const headers = requests[0].headers;
    expect(headers.get("Authorization")).toBe(`Bearer ${accessToken}`);
    expect(headers.get("X-Anonymous-Id")).toBe("anon-1");
    expect(headers.get("X-Session-Id")).toBe("session-1");
  });

  it("식별이 없어도 세션 ID는 새로 만들어 보낸다", async () => {
    const cookies = stubDocumentCookie();
    const { requests } = useAdapter();

    await api.get("/app/bootstrap");
    const headers = requests[0].headers;
    expect(headers.has("Authorization")).toBe(false);
    expect(headers.has("X-Anonymous-Id")).toBe(false);
    const sessionId = headers.get("X-Session-Id");
    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(cookies.get(IDENTITY_COOKIES.sessionId)).toBe(sessionId);
  });

  it("요청마다 세션 ID 만료를 30분 뒤로 미룬다", async () => {
    const cookies = stubDocumentCookie({
      [IDENTITY_COOKIES.sessionId]: "session-1",
    });
    useAdapter();

    await api.get("/app/bootstrap");
    expect(cookies.writes).toContain(
      `${IDENTITY_COOKIES.sessionId}=session-1; Path=/; Max-Age=1800; SameSite=lax`,
    );
  });

  it("실패는 ApiError로 reject한다", async () => {
    stubDocumentCookie();
    useAdapter(() => failure(403, "CONSENT_REQUIRED"));

    await expect(api.post("/saved-products")).rejects.toBeInstanceOf(ApiError);
  });
});
