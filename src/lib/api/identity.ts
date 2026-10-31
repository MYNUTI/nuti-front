/**
 * 토큰·익명 ID·세션 ID 저장소. 저장 방식(스크립트로 읽을 수 있는 일반 쿠키)은 이 파일과
 * `identity.server.ts`만 안다. 보안 검토에서 httpOnly가 필요해지면 저장 부분만 바꾼다.
 */
export const IDENTITY_COOKIES = {
  accessToken: "nuti_access_token",
  refreshToken: "nuti_refresh_token",
  anonymousId: "nuti_anonymous_id",
  sessionId: "nuti_session_id",
} as const;

// 백엔드 집계 규칙상 방문 세션은 30분 무활동이면 끝난다. 서버는 시간을 보지 않고 세션 ID로만 묶으므로
// 30분이 지나면 클라이언트가 새 ID를 써야 한다
const SESSION_MAX_AGE_SECONDS = 30 * 60;

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

/**
 * 현재 세션 ID를 돌려주고 만료를 30분 뒤로 미룬다. 마지막 요청 뒤 30분이 지나 쿠키가 사라졌으면
 * 새로 발급한다. 탭끼리 공유하고, 서버 컴포넌트에서도 읽을 수 있다.
 */
export function touchSessionId(): string {
  const sessionId =
    readCookie(IDENTITY_COOKIES.sessionId) ?? crypto.randomUUID();
  writeCookie(IDENTITY_COOKIES.sessionId, sessionId, SESSION_MAX_AGE_SECONDS);
  return sessionId;
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

// Secure·SameSite와 토큰·익명 ID의 만료는 API 작업 플랜 04단계 「쿠키 속성」에서 정한다
function writeCookie(name: string, value: string, maxAgeSeconds?: number) {
  const maxAge =
    maxAgeSeconds === undefined ? "" : `; Max-Age=${maxAgeSeconds}`;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/${maxAge}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}
