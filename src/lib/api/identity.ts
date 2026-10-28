/**
 * 토큰·익명 ID 저장소. 저장 방식(스크립트로 읽을 수 있는 일반 쿠키)은 이 파일과
 * `identity.server.ts`만 안다. 보안 검토에서 httpOnly가 필요해지면 저장 부분만 바꾼다.
 */
export const IDENTITY_COOKIES = {
  accessToken: "nuti_access_token",
  refreshToken: "nuti_refresh_token",
  anonymousId: "nuti_anonymous_id",
} as const;

export type Identity = {
  accessToken: string | null;
  refreshToken: string | null;
  /** 개인정보 동의 전에는 서버가 발급하지 않아 null */
  anonymousId: string | null;
};

export type Tokens = { accessToken: string; refreshToken: string };

export function readIdentity(): Identity {
  return {
    accessToken: readCookie(IDENTITY_COOKIES.accessToken),
    refreshToken: readCookie(IDENTITY_COOKIES.refreshToken),
    anonymousId: readCookie(IDENTITY_COOKIES.anonymousId),
  };
}

export function saveTokens(tokens: Tokens) {
  writeCookie(IDENTITY_COOKIES.accessToken, tokens.accessToken);
  writeCookie(IDENTITY_COOKIES.refreshToken, tokens.refreshToken);
}

/** 로그아웃·갱신 실패용. 익명 ID는 남겨 둔다 */
export function clearTokens() {
  deleteCookie(IDENTITY_COOKIES.accessToken);
  deleteCookie(IDENTITY_COOKIES.refreshToken);
}

export function saveAnonymousId(anonymousId: string) {
  writeCookie(IDENTITY_COOKIES.anonymousId, anonymousId);
}

// 값은 Next `cookies()`와 같은 방식으로 인코딩한다(쓸 때 encodeURIComponent, 읽을 때 decodeURIComponent).
// 같은 도메인의 다른 쿠키는 형식이 깨져 있을 수 있어 우리 쿠키만 디코딩한다.
// 디코딩에 실패하면 Next `cookies()`처럼 없는 쿠키로 본다.
function readCookie(name: string): string | null {
  for (const pair of document.cookie.split(";")) {
    const separator = pair.indexOf("=");
    if (separator === -1 || pair.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(pair.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

// Secure·SameSite·만료는 API 작업 플랜 04단계 「쿠키 속성」에서 정한다
function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}
