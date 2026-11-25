import type { LoginProvider } from "./_fixtures";

/** 로그인한 곳 이름(5-1 「카카오로 연결됨」 · 5-6b 「카카오 계정으로 연결했어요」) */
export const PROVIDER_LABEL: Record<LoginProvider, string> = {
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
};
