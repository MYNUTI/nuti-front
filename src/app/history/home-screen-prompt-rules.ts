/*
 * 4-1 「홈 화면에 추가」 시트를 띄울지(【최종】 ⑧ 안드로이드 · 아이폰 · 삼성 인터넷 메모, RTN_004).
 * - 즐겨찾기나 본 제품이 1개 이상인 채 기록 탭을 열 때 한 번
 * - 나중에 · 덮개 · 설치 창 취소 · 알겠어요 → 14일 동안 다시 띄우지 않음, 다시 띄우기는 2번까지(모두 3번)
 * - 홈 화면 아이콘으로 열었으면(설치됨) · 앱 안 브라우저 · PC면 띄우지 않음(아이패드는 UA가 맥이라 띄우지 않음)
 * - 안드로이드는 설치 창 신호가 있으면 「추가하기」, 없으면 메뉴 따라 하기 그림 시트(삼성 인터넷만 문장이 정해져 있다)
 */
export type HomeScreenPlatform = "android" | "ios" | "samsung";

export type PromptRecord = {
  /** 띄운 횟수 */
  shown: number;
  /** 마지막으로 닫은 때(ms) */
  closedAt: number;
  /** 설치함 — 다시 띄우지 않는다 */
  installed: boolean;
};

export const EMPTY_RECORD: PromptRecord = {
  shown: 0,
  closedAt: 0,
  installed: false,
};

import { isInAppBrowser } from "@/components/scan/camera-place";

const MAX_SHOWN = 3;
const QUIET_MS = 14 * 24 * 60 * 60 * 1000;

export function detectHomeScreenPlatform({
  userAgent,
  standalone,
  canPrompt,
}: {
  userAgent: string;
  /** 홈 화면 아이콘으로 연 상태 */
  standalone: boolean;
  /** 안드로이드 크롬의 설치 창 신호를 받아 뒀다 */
  canPrompt: boolean;
}): HomeScreenPlatform | null {
  if (standalone || isInAppBrowser(userAgent)) return null;
  // PC 크롬 · 엣지도 설치 창 신호를 준다. 이 시트는 휴대폰 홈 화면용
  if (canPrompt && /Android/i.test(userAgent)) return "android";
  if (/SamsungBrowser/i.test(userAgent)) return "samsung";
  // 아이폰 · 아이패드의 사파리만(크롬 · 파이어폭스 · 엣지는 홈 화면에 추가 메뉴가 다르다)
  if (
    /iPhone|iPad|iPod/i.test(userAgent) &&
    /Safari/i.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS/i.test(userAgent)
  )
    return "ios";
  return null;
}

export function shouldShowPrompt(record: PromptRecord, now: number) {
  if (record.installed || record.shown >= MAX_SHOWN) return false;
  return record.shown === 0 || now - record.closedAt >= QUIET_MS;
}

/** 띄운 시트를 닫았다(나중에 · 덮개 · 설치 창 취소 · 알겠어요) */
export function afterClose(record: PromptRecord, now: number): PromptRecord {
  return { ...record, shown: record.shown + 1, closedAt: now };
}

/** 기기에 남긴 값을 읽는다. 모양이 다르면(손으로 고쳤거나 이전 형식) 처음처럼 본다 */
export function parseRecord(raw: string | null): PromptRecord {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (
      value &&
      typeof value === "object" &&
      "shown" in value &&
      "closedAt" in value &&
      "installed" in value &&
      Number.isInteger(value.shown) &&
      (value.shown as number) >= 0 &&
      Number.isFinite(value.closedAt) &&
      typeof value.installed === "boolean"
    )
      return {
        shown: value.shown as number,
        closedAt: value.closedAt as number,
        installed: value.installed,
      };
  } catch {
    // 못 읽으면 처음처럼 본다
  }
  return EMPTY_RECORD;
}
