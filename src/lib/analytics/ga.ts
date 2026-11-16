/**
 * Google 애널리틱스(GA4). 개인정보 처리방침 9-2항(다른 회사가 수집해 가는 이용 정보)이 약속한 것을 여기서 지킨다.
 * - 화면 주소의 「?」 뒤(`goal` 같은 값)와 「#」 뒤는 보내지 않는다. 화면이 바뀔 때마다 정리한 주소를
 *   `set`으로 먼저 넣어, 뒤따르는 자동 이벤트(스크롤·바깥 링크 클릭 등 향상된 측정)도 그 주소를 싣게 한다.
 *   GA 관리 화면의 데이터 가리기(`goal`·`next`)는 덧대기다
 * - 회원 번호·기기 임시 번호·이메일은 보내지 않는다(`user_id`를 쓰지 않는다)
 * - 「이용 통계 보내지 않기」를 켠 브라우저는 gtag.js를 부르지 않는다. Google 공식 끄기 값
 *   `window['ga-disable-<측정 ID>']`도 세우지만, 이미 불러온 gtag.js는 나중에 세운 값을 듣지 않고 자동 이벤트를
 *   계속 보내므로(로컬 확인) 켠 화면은 새로 고친다(`hasStartedAnalytics`)
 * 측정 ID(`NEXT_PUBLIC_GA_MEASUREMENT_ID`)가 비어 있으면 아무것도 하지 않는다. Preview·개발에서는 비워 둔다
 */

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export const OPT_OUT_STORAGE_KEY = "nuti_analytics_opt_out";
const OPT_OUT_EVENT = "nuti:analytics-opt-out";

export function getMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return id ? id : null;
}

/** 주소에서 「?」 뒤와 「#」 뒤를 뺀다. 주소가 아니면 빈 문자열 */
export function toAnalyticsUrl(href: string): string {
  if (!href) return "";
  try {
    const url = new URL(href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

// 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)는 끈 상태를 기억할 수 없어 보낸다. 이번 화면에서 끈 것은
// 아래 끄기 값으로 지켜진다
export function readOptOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeOptOut(optOut: boolean) {
  try {
    if (optOut) localStorage.setItem(OPT_OUT_STORAGE_KEY, "1");
    else localStorage.removeItem(OPT_OUT_STORAGE_KEY);
  } catch {
    // 저장하지 못해도 이번 화면에서는 끄기 값으로 멈춘다
  }
  applyDisableFlag(optOut);
  window.dispatchEvent(new Event(OPT_OUT_EVENT));
}

/** `useSyncExternalStore`용. 이 탭에서 바꾼 것과 다른 탭에서 바꾼 것(storage 이벤트)을 모두 듣는다 */
export function subscribeOptOut(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === OPT_OUT_STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener(OPT_OUT_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(OPT_OUT_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function applyDisableFlag(optOut: boolean) {
  const id = getMeasurementId();
  if (!id) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = optOut;
}

let started = false;
const configured = new Set<string>();

/** 이 화면에서 GA 명령을 한 번이라도 보냈는가. 켰다가 끄면 새로 고쳐야 멈춘다 */
export function hasStartedAnalytics(): boolean {
  return started;
}

function getGtag(): Gtag {
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    // gtag.js는 배열이 아니라 arguments 객체를 받아야 명령으로 읽는다(Google 설치 코드와 같다)
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

/**
 * 화면 하나를 본 것을 보낸다. `previous`는 앞 화면의 정리한 주소(첫 화면이면 null — 그때는
 * `document.referrer`를 정리해 쓴다). 보낸 화면의 정리한 주소를 돌려준다
 */
export function trackPageView(id: string, previous: string | null): string {
  const gtag = getGtag();
  const location = toAnalyticsUrl(window.location.href);
  const referrer = previous ?? toAnalyticsUrl(document.referrer);

  applyDisableFlag(readOptOut());
  if (!started) {
    gtag("js", new Date());
    started = true;
  }
  gtag("set", { page_location: location, page_referrer: referrer });
  if (!configured.has(id)) {
    // 첫 화면도 아래 page_view로 직접 보낸다. 자동으로 보내면 정리 전 주소가 실린다
    gtag("config", id, { send_page_view: false });
    configured.add(id);
  }
  gtag("event", "page_view", {
    page_location: location,
    page_referrer: referrer,
  });
  return location;
}

/** 테스트 전용 */
export function resetAnalyticsForTest() {
  started = false;
  configured.clear();
}
