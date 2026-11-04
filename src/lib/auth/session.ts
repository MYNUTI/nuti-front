import { useSyncExternalStore } from "react";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  notifyTokensChanged,
  readIdentity,
  subscribeTokens,
} from "@/lib/api/identity";
import { onSessionExpired } from "@/lib/api/refresh";
import { goalKeys } from "@/lib/goal/keys";
import { meKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { savedKeys } from "@/lib/saved/keys";
import { searchKeys } from "@/lib/search/keys";

// 누가 요청하느냐(토큰·익명 ID)에 따라 응답이 달라지는 조회. 약관·샘플·자동완성·인기 검색어는 사용자와
// 무관해 빼고, 사용자에 따라 달라지는 조회를 새로 만들면 여기에 넣는다
const USER_QUERY_KEYS: QueryKey[] = [
  onboardingKeys.bootstrap(),
  onboardingKeys.healthConsent(),
  goalKeys.all,
  meKeys.all,
  savedKeys.all,
  productKeys.all,
  searchKeys.results(),
];

/** 로그인 뒤. 익명 기록이 계정으로 옮겨져 이전 값을 보이다가 다시 불러와도 된다 */
export function invalidateUserQueries(queryClient: QueryClient) {
  return Promise.all(
    USER_QUERY_KEYS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

/**
 * 로그아웃·탈퇴·세션 만료 뒤. 이전 계정의 저장 목록 같은 개인 정보가 다시 불러오기 전까지 화면에 남지
 * 않게 캐시를 비운다. 열려 있는 상세는 다시 불러와 조회수가 1 오른다(목표 변경과 같이 감수)
 */
export function resetUserQueries(queryClient: QueryClient) {
  return Promise.all(
    USER_QUERY_KEYS.map((queryKey) => queryClient.resetQueries({ queryKey })),
  );
}

function hasRefreshToken() {
  return readIdentity().refreshToken !== null;
}

/**
 * refresh 토큰 쿠키로 로그인 상태를 바로 판단한다. 만료된 refresh 토큰은 다음 요청의 갱신 실패가 지워
 * 곧 맞춰진다. 서버 렌더는 쿠키를 읽지 않아 false로 그리고, 브라우저에서 다시 읽는다
 */
export function useIsLoggedIn() {
  return useSyncExternalStore(subscribeTokens, hasRefreshToken, () => false);
}

type SessionEvent = "login" | "logout";

let channel: BroadcastChannel | undefined;

// 탭마다 하나만 둔다. BroadcastChannel은 보낸 객체에는 메시지를 돌려주지 않아, 보낸 탭은 스스로 처리한다
function sessionChannel() {
  return (channel ??= new BroadcastChannel("nuti-session"));
}

/**
 * 이 탭에서 로그인·로그아웃(탈퇴·세션 만료 포함)한 것을 다른 탭에 알린다. 쿠키는 탭끼리 공유하지만 캐시와
 * 로그인 상태 구독자는 탭마다 따로라, 알리지 않으면 다른 탭에 이전 계정의 개인 정보가 남는다
 */
export function broadcastSession(event: SessionEvent) {
  sessionChannel().postMessage(event);
}

/**
 * 브라우저 QueryClient에 세션 변화를 잇는다. 이 탭의 세션 만료와 다른 탭의 로그인·로그아웃 소식에 맞춰
 * 사용자 캐시를 다시 부르거나 비운다. 해제 함수를 돌려준다
 */
export function connectSession(queryClient: QueryClient) {
  const offExpired = onSessionExpired(() => {
    broadcastSession("logout");
    void resetUserQueries(queryClient);
  });
  const onMessage = ({ data }: MessageEvent<SessionEvent>) => {
    notifyTokensChanged();
    void (data === "login"
      ? invalidateUserQueries(queryClient)
      : resetUserQueries(queryClient));
  };
  sessionChannel().addEventListener("message", onMessage);
  return () => {
    offExpired();
    sessionChannel().removeEventListener("message", onMessage);
  };
}
