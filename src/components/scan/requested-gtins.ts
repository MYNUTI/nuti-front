/*
 * 이 기기에서 「제품 요청하기」로 보낸 바코드(3-6 메모 「이 기기에서 이미 요청한 바코드를 다시 찍으면
 * "이미 요청하셨어요…"」). 요청 API가 생기면 서버의 요청 상태로 바꾼다. 저장이 막혔으면 기억하지 않는다.
 */
import type { Gtin } from "@/lib/scan/types";

const KEY = "nuti_requested_gtins_v1";
// 오래된 것부터 버린다(한 기기에서 요청할 바코드가 이만큼 쌓일 일은 드물다)
const MAX = 50;

function read(): Gtin[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(
          (v): v is Gtin => typeof v === "string" && /^\d{14}$/.test(v),
        )
      : [];
  } catch {
    return [];
  }
}

export function isRequestedHere(gtin: Gtin): boolean {
  return read().includes(gtin);
}

export function addRequestedHere(gtin: Gtin) {
  try {
    const next = [gtin, ...read().filter((g) => g !== gtin)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장이 막혔으면 기억하지 않는다
  }
}
