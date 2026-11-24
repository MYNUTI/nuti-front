import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { stubLocalStorage as stubStorage } from "@/test/browser";

type Store = typeof import("./recent-store");

// 모듈 안 캐시·대체 기억을 테스트마다 새로 시작한다
async function load(): Promise<Store> {
  vi.resetModules();
  return import("./recent-store");
}

beforeEach(() => {
  vi.stubGlobal("window", new EventTarget());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("최근 검색어 저장소", () => {
  it("찾은 말을 맨 앞에 두고 같은 말은 하나만 남긴다", async () => {
    const map = stubStorage();
    const store = await load();
    store.addRecent("두유");
    store.addRecent(" 프로틴바 ");
    store.addRecent("두유");
    expect(store.readRecent()).toEqual(["두유", "프로틴바"]);
    expect(JSON.parse(map.get("nuti_recent_search_v1")!)).toEqual([
      "두유",
      "프로틴바",
    ]);
  });

  it("빈 말은 남기지 않고, 최대 개수를 넘으면 오래된 말부터 버린다", async () => {
    stubStorage();
    const store = await load();
    store.addRecent("   ");
    expect(store.readRecent()).toEqual([]);
    for (let i = 0; i < store.RECENT_MAX + 2; i++) store.addRecent(`말${i}`);
    expect(store.readRecent()).toHaveLength(store.RECENT_MAX);
    expect(store.readRecent()[0]).toBe(`말${store.RECENT_MAX + 1}`);
  });

  it("하나를 지우거나 모두 지우면 저장소에도 반영하고 알린다", async () => {
    const map = stubStorage({
      nuti_recent_search_v1: JSON.stringify(["두유", "샐러드"]),
    });
    const store = await load();
    const onChange = vi.fn();
    store.subscribeRecent(onChange);
    store.removeRecent("두유");
    expect(store.readRecent()).toEqual(["샐러드"]);
    store.clearRecent();
    expect(map.has("nuti_recent_search_v1")).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
    // 없는 말을 지우거나 빈 목록을 비우면 알리지 않는다
    store.removeRecent("없는 말");
    store.clearRecent();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["JSON이 아닌 값", "{"],
    ["배열이 아닌 값", '{"word":"두유"}'],
  ])("저장된 값이 %s이면 빈 목록으로 읽는다", async (_, raw) => {
    stubStorage({ nuti_recent_search_v1: raw });
    const store = await load();
    expect(store.readRecent()).toEqual([]);
  });

  it("모양이 틀린 값은 걸러 읽는다(문자열만, 빈 말 없이, 한 번씩, 최대 개수까지)", async () => {
    const many = Array.from({ length: 15 }, (_, i) => `말${i}`);
    stubStorage({
      nuti_recent_search_v1: JSON.stringify([1, " 두유 ", "", "두유", ...many]),
    });
    const store = await load();
    const words = store.readRecent();
    expect(words[0]).toBe("두유");
    expect(words).toHaveLength(10);
    expect(new Set(words).size).toBe(words.length);
  });

  it("내용이 바뀌지 않으면 같은 배열을 돌려준다", async () => {
    stubStorage();
    const store = await load();
    store.addRecent("두유");
    expect(store.readRecent()).toBe(store.readRecent());
  });

  it("다른 탭에서 바꾸면 알리고, 다른 키는 무시한다", async () => {
    stubStorage();
    const store = await load();
    const onChange = vi.fn();
    store.subscribeRecent(onChange);
    const storageEvent = (key: string | null) =>
      Object.assign(new Event("storage"), { key });
    window.dispatchEvent(storageEvent("other"));
    expect(onChange).not.toHaveBeenCalled();
    window.dispatchEvent(storageEvent("nuti_recent_search_v1"));
    window.dispatchEvent(storageEvent(null));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("저장에 실패하면 이 탭 안에서만 기억한다", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => undefined,
    });
    const store = await load();
    store.addRecent("두유");
    store.addRecent("샐러드");
    expect(store.readRecent()).toEqual(["샐러드", "두유"]);
  });

  it("저장소를 아예 못 읽으면 빈 목록으로 본다", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    const store = await load();
    expect(store.readRecent()).toEqual([]);
  });
});
