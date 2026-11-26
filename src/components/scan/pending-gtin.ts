/*
 * 조회 중 연결이 끊겨 아직 조회하지 못한 바코드(【최종】 3-1 메모: 「읽은 바코드를 기기에 저장해 두고 … 연결이 돌아오면 조회」).
 * 3-1을 닫았다 다시 열어도 이어 조회하도록 브라우저에 둔다. 저장이 막혔으면 그 화면에 있는 동안만 기억한다.
 */
import type { Gtin } from "@/lib/scan/types";

const KEY = "nuti_scan_pending_v1";

export function readPendingGtin(): Gtin | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(KEY);
    // 저장된 값은 늘 GTIN-14다. 다른 모양이면 버린다
    return value && /^\d{14}$/.test(value) ? (value as Gtin) : null;
  } catch {
    return null;
  }
}

export function writePendingGtin(gtin: Gtin) {
  try {
    localStorage.setItem(KEY, gtin);
  } catch {
    // 저장이 막혔으면 화면에 있는 동안만 기억한다
  }
}

export function clearPendingGtin() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 지울 것도 못 남겼다
  }
}
