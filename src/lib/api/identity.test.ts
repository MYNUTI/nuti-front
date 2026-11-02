import { afterEach, describe, expect, it, vi } from "vitest";
import {
  IDENTITY_COOKIES,
  clearTokens,
  readIdentity,
  saveAnonymousId,
  saveTokens,
} from "@/lib/api/identity";
import { stubDocumentCookie } from "@/test/browser";

describe("identity 쿠키 속성", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("토큰은 7일, SameSite=lax로 저장한다", () => {
    const cookies = stubDocumentCookie();
    saveTokens({ accessToken: "access-1", refreshToken: "refresh-1" });
    expect(cookies.writes).toEqual([
      `${IDENTITY_COOKIES.accessToken}=access-1; Path=/; Max-Age=604800; SameSite=lax`,
      `${IDENTITY_COOKIES.refreshToken}=refresh-1; Path=/; Max-Age=604800; SameSite=lax`,
    ]);
  });

  it("익명 ID는 400일로 저장한다", () => {
    const cookies = stubDocumentCookie();
    saveAnonymousId("anon-1");
    expect(cookies.writes).toEqual([
      `${IDENTITY_COOKIES.anonymousId}=anon-1; Path=/; Max-Age=34560000; SameSite=lax`,
    ]);
  });

  it("HTTPS에서만 Secure를 붙인다", () => {
    const cookies = stubDocumentCookie({}, { protocol: "https:" });
    saveAnonymousId("anon-1");
    expect(cookies.writes[0]).toMatch(/; Secure$/);
  });

  it("값은 인코딩해 쓰고 읽을 때 되돌린다", () => {
    stubDocumentCookie();
    saveTokens({ accessToken: "a;b=c", refreshToken: "한글" });
    expect(readIdentity()).toEqual({
      accessToken: "a;b=c",
      refreshToken: "한글",
      anonymousId: null,
    });
    clearTokens();
    expect(readIdentity().accessToken).toBeNull();
  });
});
