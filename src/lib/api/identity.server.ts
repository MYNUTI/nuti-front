import { cookies } from "next/headers";
import { IDENTITY_COOKIES, type Identity } from "@/lib/api/identity";

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
