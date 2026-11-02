import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_SAME_SITE,
  IDENTITY_COOKIES,
  TOKEN_MAX_AGE_SECONDS,
  type Identity,
  type Tokens,
} from "@/lib/api/identity";

/**
 * 서버 컴포넌트에서 요청 쿠키의 토큰·익명 ID를 읽는다. 렌더 중에는 쿠키를 쓸 수 없어서
 * 읽기만 있다. 새 토큰 저장은 `src/proxy.ts`가 맡는다.
 */
export async function readServerIdentity(): Promise<Identity> {
  const store = await cookies();
  return {
    accessToken: store.get(IDENTITY_COOKIES.accessToken)?.value ?? null,
    refreshToken: store.get(IDENTITY_COOKIES.refreshToken)?.value ?? null,
    anonymousId: store.get(IDENTITY_COOKIES.anonymousId)?.value ?? null,
  };
}

/** 쿠키의 세션 ID. 렌더 중에는 새로 만들거나 만료를 미룰 수 없어 없으면 null이다 */
export async function readServerSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(IDENTITY_COOKIES.sessionId)?.value ?? null;
}

/** `src/proxy.ts`용. 렌더 전 요청 쿠키의 토큰을 읽는다 */
export function readProxyTokens(
  request: NextRequest,
): Pick<Identity, "accessToken" | "refreshToken"> {
  return {
    accessToken:
      request.cookies.get(IDENTITY_COOKIES.accessToken)?.value ?? null,
    refreshToken:
      request.cookies.get(IDENTITY_COOKIES.refreshToken)?.value ?? null,
  };
}

/**
 * `src/proxy.ts`용. 새 토큰을 응답 `Set-Cookie`(브라우저 저장)와 요청 `cookie` 헤더 양쪽에 넣는다.
 * 응답에만 넣으면 같은 요청에서 렌더되는 서버 컴포넌트의 `cookies()`가 만료된 토큰을 읽는다.
 * 쿠키 속성은 브라우저의 `identity.ts` `writeCookie`와 같아야 한다. 프로토콜은 Next가 소켓 암호화 여부나
 * `x-forwarded-proto`로 정해, TLS를 앞단에서 끝내는 배포·터널에서도 HTTPS로 잡힌다.
 */
export function nextWithTokens(
  request: NextRequest,
  tokens: Tokens,
): NextResponse {
  const entries = [
    [IDENTITY_COOKIES.accessToken, tokens.accessToken],
    [IDENTITY_COOKIES.refreshToken, tokens.refreshToken],
  ] as const;
  for (const [name, value] of entries) request.cookies.set(name, value);
  const response = NextResponse.next({ request: { headers: request.headers } });
  const attributes = {
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
    sameSite: COOKIE_SAME_SITE,
    secure: request.nextUrl.protocol === "https:",
  } as const;
  for (const [name, value] of entries)
    response.cookies.set(name, value, attributes);
  return response;
}
