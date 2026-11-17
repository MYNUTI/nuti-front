import { useSyncExternalStore } from "react";

import {
  canReadOptOutStorage,
  readOptOut,
  subscribeOptOut,
} from "@/lib/analytics/ga";

/**
 * 「이용 통계 보내지 않기」 상태. 서버 렌더에서는 브라우저 저장소를 못 읽어 `serverValue`로 그린 뒤 브라우저 값으로
 * 바꾼다. GA를 부르는 쪽은 true(확인 전에는 보내지 않음), 스위치 화면은 false(대부분의 값)를 넘긴다
 */
export function useAnalyticsOptOut(serverValue: boolean): boolean {
  return useSyncExternalStore(subscribeOptOut, readOptOut, () => serverValue);
}

const noSubscribe = () => () => undefined;

/** 저장소를 읽을 수 있는가. 서버 렌더에서는 알 수 없어 읽을 수 있음으로 그린 뒤 브라우저 값으로 바꾼다 */
export function useOptOutStorageReadable(): boolean {
  return useSyncExternalStore(noSubscribe, canReadOptOutStorage, () => true);
}
