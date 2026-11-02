import type { AxiosInstance } from "axios";
import { ApiError } from "@/lib/api/errors";
import {
  clearAnonymousId,
  clearTokens,
  readIdentity,
  saveTokens,
  type Identity,
  type Tokens,
} from "@/lib/api/identity";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";

// 만료된 액세스 토큰은 401 없이 비로그인으로 처리되므로 만료 전에 갱신해야 한다.
// 여유분은 요청이 서버에 닿는 시간과 60초 이내의 기기·서버 시계 오차를 흡수한다
const REFRESH_MARGIN_MS = 60_000;

const REFRESH_LOCK = "nuti-token-refresh";

let pendingRefresh: Promise<string | null> | null = null;

/** 액세스 토큰이 여유분 안에 만료되는지. `exp`를 읽을 수 없는 토큰도 갱신 대상으로 본다 */
export function isExpiringSoon(accessToken: string, now = Date.now()): boolean {
  const exp = readExp(accessToken);
  return exp === null || exp * 1000 - now <= REFRESH_MARGIN_MS;
}

/** `/auth/refresh`로 새 토큰 쌍을 받는다. 서버는 refresh 토큰도 교체하므로 둘 다 저장해야 한다 */
export function requestRefresh(
  http: AxiosInstance,
  refreshToken: string,
): Promise<Tokens> {
  return http
    .post<ApiSuccess<Tokens>>("/auth/refresh", { refreshToken })
    .then(unwrap);
}

/**
 * 브라우저 전용. 요청에 붙일 액세스 토큰을 돌려주고, 곧 만료되면 먼저 갱신한다. 갱신이 거절되면
 * 로그아웃하고 null을 돌려준다. 같은 탭의 동시 요청은 갱신 한 번을 기다린다. `http`는 이 함수를
 * 부르는 인터셉터가 없는 인스턴스여야 한다. 아니면 갱신 요청이 자기 자신을 기다린다.
 */
export function getFreshAccessToken(
  http: AxiosInstance,
): Promise<string | null> {
  const identity = readIdentity();
  if (!needsRefresh(identity)) return Promise.resolve(identity.accessToken);

  // 서버가 갱신마다 refresh 토큰을 교체해, 두 탭이 같은 토큰으로 갱신하면 늦은 쪽이 INVALID_TOKEN을
  // 받는다. 락으로 탭 사이 갱신을 하나씩 돌리고, 락을 잡은 뒤 쿠키를 다시 읽어 다른 탭이 이미
  // 갱신했으면 그 토큰을 쓴다
  return (pendingRefresh ??= refreshInLock(http).finally(() => {
    pendingRefresh = null;
  }));
}

async function refreshInLock(http: AxiosInstance): Promise<string | null> {
  return navigator.locks.request(REFRESH_LOCK, async () => {
    const current = readIdentity();
    if (!needsRefresh(current)) return current.accessToken;
    try {
      const tokens = await requestRefresh(http, current.refreshToken);
      saveTokens(tokens);
      return tokens.accessToken;
    } catch (error) {
      if (!isRefreshRejected(error)) throw error;
      // `src/proxy.ts`는 이 락 밖에서 갱신한다. 그사이 refresh 토큰이 교체됐으면 거절은 그 때문이라
      // 새 토큰을 쓴다. 401이 proxy 응답의 Set-Cookie보다 먼저 오면 아래에서 지우게 되는데, 토큰은
      // 뒤이어 온 Set-Cookie가 다시 쓰지만 익명 ID는 돌아오지 않는다. 그사이 나간 요청은 비로그인이다
      const latest = readIdentity();
      if (latest.refreshToken !== current.refreshToken)
        return latest.accessToken;
      // refresh 토큰이 만료됐거나 다른 기기의 로그인·로그아웃으로 지워졌다. 다시 보내도 같은 401이라
      // 남겨 두면 이후 요청이 모두 갱신 실패로 막힌다. 익명 ID는 로그인 때 계정에 병합돼 서버가 더는
      // 인정하지 않으므로 함께 지운다. 정상 로그아웃과 달리 토큰이 없어 새 익명 ID를 받을 수 없다
      clearTokens();
      clearAnonymousId();
      return null;
    }
  });
}

/** refresh 토큰이 있고 액세스 토큰이 없거나 곧 만료되는지. 브라우저 인터셉터와 `src/proxy.ts`가 같이 쓴다 */
export function needsRefresh<
  T extends Pick<Identity, "accessToken" | "refreshToken">,
>(identity: T): identity is T & { refreshToken: string } {
  return (
    identity.refreshToken !== null &&
    (identity.accessToken === null || isExpiringSoon(identity.accessToken))
  );
}

function isRefreshRejected(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "TOKEN_EXPIRED" || error.code === "INVALID_TOKEN")
  );
}

function readExp(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const claims: unknown = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (
      typeof claims !== "object" ||
      claims === null ||
      !("exp" in claims) ||
      typeof claims.exp !== "number"
    )
      return null;
    return claims.exp;
  } catch {
    return null;
  }
}
