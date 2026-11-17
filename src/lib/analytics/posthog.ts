import type {
  CaptureResult,
  CapturedNetworkRequest,
  PostHogConfig,
} from "posthog-js";

/**
 * PostHog(화면 기록 · 클릭). 회사가 받은 기록을 우리 일 말고는 쓰지 않는 처리 위탁(DPA 2.5)이라 GA와 같이
 * 「모두 보내고, 이용 통계 보내지 않기를 켠 사람만 뺀다」. 처리방침 9-2항의 약속을 여기서 지킨다.
 * - 주소의 「?」 · 「#」 뒤(`goal` · `next` 같은 값)는 보내지 않는다 — 이벤트의 주소 칸, 녹화 속 링크 · 요청 주소 모두
 * - 고른 목표 · 몸 정보 낱말은 녹화에서 「***」로 가린다(길이로 짐작하지 못하게 늘 세 글자). 목표를 고르는
 *   화면은 `ph-no-capture` 로 통째로 가리고, 그 화면의 클릭 · 히트맵 이벤트는 버린다
 * - 입력 칸 값은 가린다(기본값) · 클릭한 요소의 글자 · 속성은 보내지 않는다 · user_id 를 쓰지 않는다(identify 안 함)
 * 키(`NEXT_PUBLIC_POSTHOG_KEY`)가 비어 있으면 아무것도 하지 않는다. Preview · 개발에서는 비워 둔다
 */

// EU 서버(독일). 가입한 프로젝트가 EU 라 주소도 EU 로 고정한다
const API_HOST = "https://eu.i.posthog.com";
const UI_HOST = "https://eu.posthog.com";

export function getPosthogKey(): string | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  return key ? key : null;
}

/** 주소 같은 문자열에서 「?」 뒤와 「#」 뒤를 뺀다(절대 · 상대 주소 모두) */
export function stripQuery(value: string): string {
  return value.replace(/[?#][\s\S]*$/, "");
}

// 목표 이름 · 몸 정보 · 이메일 주소. 화면 글자에 섞여 나오는 것까지 낱말 단위로 찾는다.
// 닉네임 같은 이름은 글자 모양으로 못 찾는다 — 이름을 보여 주는 곳(내 정보 계정 줄 등)에는 `ph-mask` 를 붙인다
const SENSITIVE_TEXT =
  /다이어트|근육\s*증가|체중\s*감량|벌크업|\d+(?:\.\d+)?\s*(?:cm|kg|㎝|㎏)|\d[\d,]*\s*kcal\s*기준|\d{4}\s*년생|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi;
const MASK = "***";

/** 녹화 글자 가리기(`maskTextSelector: "*"` 와 함께 모든 글자에 불린다). `ph-mask` 안의 글자는 통째로 가린다 */
export function maskSensitiveText(text: string, element?: HTMLElement): string {
  if (element?.closest?.(".ph-mask")) return text.trim() ? MASK : text;
  return text.replace(SENSITIVE_TEXT, MASK);
}

// 링크 · 양식 주소에는 목표 값이 붙는다. 그림 주소는 그림 파일 이름에 목표가 들어 있을 때만 지운다
const URL_ATTRIBUTES = new Set(["href", "action", "formaction"]);
const IMAGE_ATTRIBUTES = new Set(["src", "srcset"]);
const GOAL_IMAGE = /diet|muscle/i;

/** 녹화 속 요소 속성 가리기 */
export function maskAttribute(name: string, value: string): string {
  const key = name.toLowerCase();
  if (URL_ATTRIBUTES.has(key)) return stripQuery(value);
  if (IMAGE_ATTRIBUTES.has(key) && GOAL_IMAGE.test(value)) return "";
  return value;
}

/** 녹화에 함께 남는 요청 · 화면 주소 가리기(문서: 녹화 속 화면 주소에도 불린다) */
export function maskNetworkRequest(
  request: CapturedNetworkRequest,
): CapturedNetworkRequest {
  return request.name
    ? { ...request, name: stripQuery(request.name) }
    : request;
}

// 목표를 고르는 화면. 녹화는 `ph-no-capture` 로 가리고, 이 화면의 클릭 · 히트맵은 위치만으로 고른 칸이 드러나 버린다
const SENSITIVE_PATHS = ["/intro/goal", "/onboarding/goal", "/my/goal"];
const POSITIONAL_EVENTS = new Set([
  "$autocapture",
  "$rageclick",
  "$dead_click",
  "$$heatmap",
]);

export function isSensitivePath(pathname: string): boolean {
  return SENSITIVE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

// 주소가 들어가는 칸 이름(예: $current_url · $referrer · $initial_current_url · $session_entry_url)
const URL_KEY = /(url|referrer)$/i;

function stripUrlValues(properties: Record<string, unknown> | undefined) {
  if (!properties) return;
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "string" && URL_KEY.test(key))
      properties[key] = stripQuery(value);
  }
}

// 녹화(rrweb)의 「입력」 기록: 증분 스냅숏(type 3) 중 입력(source 5). 고르기 칸(라디오 · 체크박스) 값은 PostHog 의
// 입력 가리기 대상(maskInputOptions)에 없고, ph-no-capture 로 가린 칸이어도 값이 실린다(11-17 로컬 실측 — `"text":"diet"`).
// 그래서 보내기 직전에 입력 기록의 값을 모두 가린다. 글자 칸 값은 원래 가려져 있어 잃는 것이 없다
const RRWEB_INCREMENTAL = 3;
const RRWEB_INPUT = 5;

function maskInputRecords(properties: Record<string, unknown> | undefined) {
  const records = properties?.$snapshot_data;
  if (!Array.isArray(records)) return;
  for (const record of records) {
    const data = (record as { type?: number; data?: Record<string, unknown> })
      .data;
    if (
      (record as { type?: number }).type === RRWEB_INCREMENTAL &&
      data?.source === RRWEB_INPUT &&
      typeof data.text === "string"
    )
      data.text = MASK;
  }
}

/** 보내기 직전 모든 이벤트(녹화 묶음 $snapshot 포함)에 불린다. null 이면 보내지 않는다 */
export function sanitizeEvent(
  event: CaptureResult | null,
): CaptureResult | null {
  if (!event) return null;
  const pathname = event.properties?.$pathname;
  if (
    POSITIONAL_EVENTS.has(event.event) &&
    typeof pathname === "string" &&
    isSensitivePath(pathname)
  )
    return null;
  if (event.event === "$snapshot") maskInputRecords(event.properties);
  stripUrlValues(event.properties);
  stripUrlValues(event.$set);
  stripUrlValues(event.$set_once);
  return event;
}

export function posthogConfig(): Partial<PostHogConfig> {
  return {
    api_host: API_HOST,
    ui_host: UI_HOST,
    // identify 를 부르지 않으므로 사람 단위 프로필을 만들지 않는다
    person_profiles: "identified_only",
    capture_pageview: "history_change",
    capture_pageleave: true,
    // 클릭 · 히트맵은 모은다. 클릭한 요소의 글자와 속성(링크 주소 포함)은 보내지 않는다
    autocapture: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    // 개발용 안내문 · 서버 요청 기록은 녹화에 넣지 않는다(검색 요청 주소에 목표 값이 붙는다)
    enable_recording_console_log: false,
    capture_performance: false,
    disable_surveys: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
      maskTextFn: maskSensitiveText,
      maskAttributeFn: maskAttribute,
      maskCapturedNetworkRequestFn: maskNetworkRequest,
      recordHeaders: false,
      recordBody: false,
    },
    before_send: sanitizeEvent,
  };
}
