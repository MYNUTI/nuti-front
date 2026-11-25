import type { Metadata } from "next";

import {
  DELETE_REQUEST_EMAIL,
  FIXTURE_DEVICE_ID,
} from "@/app/privacy/_fixtures";

import { version } from "../../../package.json";

import { SettingsScreen } from "./settings-screen";

export const metadata: Metadata = { title: "설정" };

/*
 * 5-5 설정(【최종】). 5-1의 톱니에서 온다. 뒤로(‹)는 5-1.
 * 로그인 전 · 후가 같은 배치이고, 로그인 후에는 「이 기기 기록 지우기」 줄이 빠지고(기록이 계정으로 옮겨지고 계정 삭제가 있어서)
 * 맨 아래 「계정」 구역(로그아웃 · 계정 삭제)이 생긴다.
 */
export default async function Page({ searchParams }: PageProps<"/settings">) {
  /*
   * 미리보기: ?state=login — 로그인 후. API를 붙이면 로그인 상태(`useIsLoggedIn`)로 정한다
   * ?sheet=device-delete — 로그인 전에 5-10b 시트를 연 채로(이 값 하나만 받는다)
   */
  const { state, sheet } = await searchParams;
  return (
    <SettingsScreen
      loggedIn={state === "login"}
      version={version}
      deviceDelete={{
        initialOpen: sheet === "device-delete",
        deviceId: FIXTURE_DEVICE_ID,
        email: DELETE_REQUEST_EMAIL,
      }}
    />
  );
}
