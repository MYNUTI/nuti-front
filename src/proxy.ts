import axios from "axios";
import { NextResponse, type NextRequest } from "next/server";
import { nextWithTokens, readProxyTokens } from "@/lib/api/identity.server";
import { needsRefresh, requestRefresh } from "@/lib/api/refresh";

// 상한 값과 근거는 client.ts와 같다. 실패는 종류와 관계없이 그대로 통과시키므로 ApiError로 바꾸지 않는다
const refreshApi = axios.create({
  baseURL: process.env.API_URL,
  timeout: 10_000,
});

/**
 * 상품 상세는 서버 컴포넌트가 쿠키의 토큰으로 개인 기준 조회를 한다. 렌더 중에는 쿠키를 쓸 수 없어
 * 만료가 가까운 토큰을 렌더 전에 여기서 갱신한다.
 */
export async function proxy(request: NextRequest) {
  const tokens = readProxyTokens(request);
  if (!needsRefresh(tokens)) return NextResponse.next();
  try {
    const fresh = await requestRefresh(refreshApi, tokens.refreshToken);
    return nextWithTokens(request, fresh);
  } catch {
    // 실패해도 쿠키는 지우지 않는다. 다른 탭이 같은 refresh 토큰을 방금 교체해 INVALID_TOKEN이 왔을 수
    // 있는데, 여기서는 브라우저의 Web Locks를 잡을 수 없어 구분하지 못한다. 지우면 정상 세션이
    // 로그아웃되므로 정리는 브라우저 인터셉터에 맡기고, 이번 렌더만 비로그인 기준으로 나간다
    return NextResponse.next();
  }
}

export const config = {
  // 브라우저 갱신과 겹치지 않게 페이지 이동 요청에서만 갱신한다. API 요청(/api)은 브라우저 인터셉터가
  // 갱신하고, 화면에 보이는 링크마다 오는 프리페치는 제외한다
  matcher: [
    {
      source: "/product/:id",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
