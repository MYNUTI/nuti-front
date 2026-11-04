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

// 토큰 쿠키는 둘 다 refresh 토큰 수명(API 작업 플랜 「진행 가정」 7일)에 맞춘다. 액세스 토큰 만료는
// 쿠키 만료가 아니라 JWT `exp`로 판단한다. 세션 쿠키로 두면 PWA를 다시 열 때 로그인이 풀린다
export const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// 브라우저가 허용하는 쿠키 만료 상한(Chrome 400일). 익명 ID가 사라지면 동의 전 익명 기록과 연결이 끊긴다
const ANONYMOUS_ID_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

// 외부 링크로 상세에 들어와도 첫 요청에 쿠키가 실려 서버 렌더가 개인 기준이 되도록 Strict가 아닌 Lax다.
// 백엔드는 쿠키가 아니라 헤더로 인증해 CSRF 부담은 없다
export const COOKIE_SAME_SITE = "lax";

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

const tokenListeners = new Set<() => void>();

/**
 * 토큰 쿠키를 쓰거나 지울 때 알린다. 쿠키는 바뀌어도 이벤트가 없어, 로그인 상태를 쿠키로 판단하는 화면이
 * 이걸로 다시 읽는다. 해제 함수를 돌려준다
 */
export function subscribeTokens(listener: () => void) {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

/** 다른 탭이 공유 쿠키를 바꿨다는 소식(`auth/session.ts`)을 받았을 때 이 탭의 구독자를 깨운다 */
export function notifyTokensChanged() {
  tokenListeners.forEach((listener) => listener());
}

export function saveTokens(tokens: Tokens) {
  writeCookie(
    IDENTITY_COOKIES.accessToken,
    tokens.accessToken,
    TOKEN_MAX_AGE_SECONDS,
  );
  writeCookie(
    IDENTITY_COOKIES.refreshToken,
    tokens.refreshToken,
    TOKEN_MAX_AGE_SECONDS,
  );
  notifyTokensChanged();
}

/** 로그아웃·갱신 실패용. 익명 ID는 건드리지 않는다 */
export function clearTokens() {
  deleteCookie(IDENTITY_COOKIES.accessToken);
  deleteCookie(IDENTITY_COOKIES.refreshToken);
  notifyTokensChanged();
}

export function saveAnonymousId(anonymousId: string) {
  writeCookie(
    IDENTITY_COOKIES.anonymousId,
    anonymousId,
    ANONYMOUS_ID_MAX_AGE_SECONDS,
  );
}

export function clearAnonymousId() {
  deleteCookie(IDENTITY_COOKIES.anonymousId);
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

// 속성은 `identity.server.ts`의 `nextWithTokens`와 같아야 한다. Secure는 HTTPS에서만 붙여
// http://localhost 개발에서도 쿠키가 저장되게 한다
function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=${COOKIE_SAME_SITE}${secure}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}
