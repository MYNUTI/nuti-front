import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  OPT_OUT_STORAGE_KEY,
  getMeasurementId,
  hasStartedAnalytics,
  isOptOutSaved,
  readOptOut,
  resetAnalyticsForTest,
  subscribeOptOut,
  toAnalyticsUrl,
  trackPageView,
  writeOptOut,
} from "@/lib/analytics/ga";
import { stubLocalStorage } from "@/test/browser";

const ID = "G-TEST";

// 테스트 환경(node)에 없는 window·document를 흉내 낸다. window는 이벤트를 주고받아야 해서 EventTarget이다
function stubBrowser({
  href = "https://nutriuniv.co.kr/home?goal=diet&guide=1",
  referrer = "",
}: { href?: string; referrer?: string } = {}) {
  const win = Object.assign(new EventTarget(), { location: { href } });
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", { referrer });
  return win as unknown as Window & Record<string, unknown>;
}

// dataLayer에는 arguments 객체가 쌓인다. 비교하기 쉽게 배열로 바꾼다
function commands(win: Window) {
  return (win.dataLayer ?? []).map((entry) =>
    Array.from(entry as ArrayLike<unknown>),
  );
}

afterEach(() => {
  resetAnalyticsForTest();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("toAnalyticsUrl", () => {
  it("「?」 뒤와 「#」 뒤를 뺀다", () => {
    expect(
      toAnalyticsUrl("https://nutriuniv.co.kr/home?goal=diet&guide=1#top"),
    ).toBe("https://nutriuniv.co.kr/home");
    expect(
      toAnalyticsUrl(
        "https://nutriuniv.co.kr/intro/goal?next=%2Fproduct%2F12%3Fgoal%3Dmuscle",
      ),
    ).toBe("https://nutriuniv.co.kr/intro/goal");
    expect(toAnalyticsUrl("https://nutriuniv.co.kr/product/12")).toBe(
      "https://nutriuniv.co.kr/product/12",
    );
  });

  it("비었거나 주소가 아니면 빈 문자열", () => {
    expect(toAnalyticsUrl("")).toBe("");
    expect(toAnalyticsUrl("goal=diet")).toBe("");
  });
});

describe("getMeasurementId", () => {
  it("비어 있으면 null", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    expect(getMeasurementId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", ID);
    expect(getMeasurementId()).toBe(ID);
  });
});

describe("trackPageView", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", ID);
    stubLocalStorage();
  });

  it("첫 화면은 정리한 주소로 설정하고 page_view를 직접 보낸다", () => {
    const win = stubBrowser({
      referrer: "https://nutriuniv.co.kr/intro/goal?next=%2Fhome",
    });

    const sent = trackPageView(ID, null);

    expect(sent).toBe("https://nutriuniv.co.kr/home");
    const list = commands(win);
    expect(list[0][0]).toBe("js");
    expect(list.slice(1)).toEqual([
      [
        "set",
        {
          page_location: "https://nutriuniv.co.kr/home",
          page_referrer: "https://nutriuniv.co.kr/intro/goal",
        },
      ],
      ["config", ID, { send_page_view: false }],
      [
        "event",
        "page_view",
        {
          page_location: "https://nutriuniv.co.kr/home",
          page_referrer: "https://nutriuniv.co.kr/intro/goal",
        },
      ],
    ]);
  });

  it("다음 화면은 앞 화면 주소를 들어온 주소로 쓰고 설정을 다시 하지 않는다", () => {
    const win = stubBrowser();
    const first = trackPageView(ID, null);
    win.location.href = "https://nutriuniv.co.kr/product/12?goal=muscle";

    trackPageView(ID, first);

    const list = commands(win);
    expect(list.filter(([name]) => name === "config")).toHaveLength(1);
    expect(list.filter(([name]) => name === "js")).toHaveLength(1);
    expect(list.at(-1)).toEqual([
      "event",
      "page_view",
      {
        page_location: "https://nutriuniv.co.kr/product/12",
        page_referrer: "https://nutriuniv.co.kr/home",
      },
    ]);
  });

  it("보내는 값 어디에도 목표가 없다", () => {
    const win = stubBrowser({
      href: "https://nutriuniv.co.kr/home?goal=diet",
      referrer:
        "https://nutriuniv.co.kr/product/3?goal=muscle&next=%2Fhome%3Fgoal%3Ddiet",
    });
    trackPageView(ID, null);

    const text = JSON.stringify(commands(win));
    expect(text).not.toMatch(/goal|diet|muscle/);
  });

  it("끈 브라우저는 Google 끄기 값이 선다", () => {
    stubLocalStorage({ [OPT_OUT_STORAGE_KEY]: "1" });
    const win = stubBrowser();

    trackPageView(ID, null);

    expect(win[`ga-disable-${ID}`]).toBe(true);
  });

  it("한 번 보내면 시작한 것으로 남는다(끌 때 새로 고칠지 판단)", () => {
    stubBrowser();
    expect(hasStartedAnalytics()).toBe(false);

    trackPageView(ID, null);

    expect(hasStartedAnalytics()).toBe(true);
  });
});

describe("이용 통계 보내지 않기", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", ID);
  });

  it("켜고 끄면 저장소·끄기 값·구독자가 함께 바뀐다", () => {
    const store = stubLocalStorage();
    const win = stubBrowser();
    const onChange = vi.fn();
    const unsubscribe = subscribeOptOut(onChange);

    writeOptOut(true);
    expect(store.get(OPT_OUT_STORAGE_KEY)).toBe("1");
    expect(readOptOut()).toBe(true);
    expect(win[`ga-disable-${ID}`]).toBe(true);

    writeOptOut(false);
    expect(store.has(OPT_OUT_STORAGE_KEY)).toBe(false);
    expect(readOptOut()).toBe(false);
    expect(win[`ga-disable-${ID}`]).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    writeOptOut(true);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("다른 탭의 변경은 같은 키일 때만 알린다", () => {
    stubLocalStorage();
    const win = stubBrowser();
    const onChange = vi.fn();
    subscribeOptOut(onChange);

    win.dispatchEvent(Object.assign(new Event("storage"), { key: "other" }));
    expect(onChange).not.toHaveBeenCalled();
    win.dispatchEvent(
      Object.assign(new Event("storage"), { key: OPT_OUT_STORAGE_KEY }),
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("저장소를 아예 못 읽으면 보내지 않음으로 읽는다(스위치가 듣지 않으므로)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => undefined,
    });
    stubBrowser();

    expect(readOptOut()).toBe(true);
  });

  it("쓰기만 실패하면 이 화면에서만 기억하고 저장 안 됨으로 알린다", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => undefined,
    });
    const win = stubBrowser();

    expect(readOptOut()).toBe(false);
    writeOptOut(true);
    expect(readOptOut()).toBe(true);
    expect(isOptOutSaved()).toBe(false);
    expect(win[`ga-disable-${ID}`]).toBe(true);

    writeOptOut(false);
    expect(isOptOutSaved()).toBe(true);
    expect(readOptOut()).toBe(false);
  });
});
