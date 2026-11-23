import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { stubLocalStorage as stubStorage } from "@/test/browser";

type Store = typeof import("./compare-store");

const item = (id: string) => ({ id, name: `제품 ${id}`, image: null });
// 저장된 모양(담은 시각 포함)
const stored = (id: string) => ({ ...item(id), addedAt: 1 });

// 모듈 안 캐시·대체 기억을 테스트마다 새로 시작한다
async function load(): Promise<Store> {
  vi.resetModules();
  return import("./compare-store");
}

beforeEach(() => {
  vi.stubGlobal("window", new EventTarget());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("비교함 저장소", () => {
  it("담으면 담은 시각과 함께 저장소에 남는다", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-21T09:00:00Z") });
    const map = stubStorage();
    const store = await load();
    expect(store.addToCompare(item("1"))).toBe("added");
    expect(store.readCompare().map((i) => i.id)).toEqual(["1"]);
    expect(JSON.parse(map.get("nuti_compare_v1")!)).toEqual([
      { ...item("1"), addedAt: Date.parse("2026-11-21T09:00:00Z") },
    ]);
  });

  it("담은 시각이 없는 옛 모양은 버린다", async () => {
    stubStorage({ nuti_compare_v1: JSON.stringify([item("1"), stored("2")]) });
    const store = await load();
    expect(store.readCompare().map((i) => i.id)).toEqual(["2"]);
  });

  it("이미 담은 제품은 다시 담지 않는다", async () => {
    stubStorage();
    const store = await load();
    store.addToCompare(item("1"));
    expect(store.addToCompare(item("1"))).toBe("exists");
    expect(store.readCompare()).toHaveLength(1);
  });

  it("4개가 차면 담지 않고 full을 돌려준다", async () => {
    stubStorage();
    const store = await load();
    for (const id of ["1", "2", "3", "4"]) store.addToCompare(item(id));
    expect(store.addToCompare(item("5"))).toBe("full");
    expect(store.readCompare().map((i) => i.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("빼면 나머지 순서를 지키고, 다 빼면 저장소에서 지운다", async () => {
    const map = stubStorage();
    const store = await load();
    for (const id of ["1", "2", "3"]) store.addToCompare(item(id));
    store.removeFromCompare("2");
    expect(store.readCompare().map((i) => i.id)).toEqual(["1", "3"]);
    store.removeFromCompare("1");
    store.removeFromCompare("3");
    expect(map.has("nuti_compare_v1")).toBe(false);
  });

  it("하나를 빼고 담으면 한 번만 알리고 뺀 자리 대신 끝에 담는다", async () => {
    vi.useFakeTimers({ now: 1000 });
    stubStorage();
    const store = await load();
    for (const id of ["1", "2", "3", "4"]) store.addToCompare(item(id));
    vi.setSystemTime(5000);
    const onChange = vi.fn();
    store.subscribeCompare(onChange);
    expect(store.replaceInCompare("2", item("5"))).toBe(true);
    expect(store.readCompare().map((i) => i.id)).toEqual(["1", "3", "4", "5"]);
    // 남은 제품은 원래 담은 시각 그대로, 새로 담은 제품만 지금 시각
    expect(store.readCompare().map((i) => i.addedAt)).toEqual([
      1000, 1000, 1000, 5000,
    ]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("뺄 제품이 없거나 담을 제품이 이미 있으면 바꾸지 않는다", async () => {
    stubStorage();
    const store = await load();
    for (const id of ["1", "2"]) store.addToCompare(item(id));
    expect(store.replaceInCompare("9", item("5"))).toBe(false);
    expect(store.replaceInCompare("1", item("2"))).toBe(false);
    expect(store.readCompare().map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("비우면 저장소에서 지우고, 이미 비었으면 알리지 않는다", async () => {
    const map = stubStorage();
    const store = await load();
    for (const id of ["1", "2"]) store.addToCompare(item(id));
    const onChange = vi.fn();
    store.subscribeCompare(onChange);
    store.clearCompare();
    expect(map.has("nuti_compare_v1")).toBe(false);
    expect(store.readCompare()).toEqual([]);
    store.clearCompare();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("내용이 바뀌지 않으면 같은 배열을 돌려준다", async () => {
    stubStorage();
    const store = await load();
    store.addToCompare(item("1"));
    expect(store.readCompare()).toBe(store.readCompare());
  });

  it.each([
    ["JSON이 아닌 값", "{"],
    ["배열이 아닌 값", '{"id":"1"}'],
  ])("저장된 값이 %s이면 빈 비교함으로 본다", async (_, raw) => {
    stubStorage({ nuti_compare_v1: raw });
    const store = await load();
    expect(store.readCompare()).toEqual([]);
  });

  it("모양이 틀린 줄·겹친 제품·넘친 개수는 걸러 읽는다", async () => {
    stubStorage({
      nuti_compare_v1: JSON.stringify([
        stored("1"),
        { id: 2 },
        stored("1"),
        stored("3"),
        stored("4"),
        stored("5"),
        stored("6"),
      ]),
    });
    const store = await load();
    expect(store.readCompare().map((i) => i.id)).toEqual(["1", "3", "4", "5"]);
  });

  it("바꾸면 같은 탭 구독자에게 알린다", async () => {
    stubStorage();
    const store = await load();
    const onChange = vi.fn();
    const unsubscribe = store.subscribeCompare(onChange);
    store.addToCompare(item("1"));
    expect(onChange).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.removeFromCompare("1");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("다른 탭에서 비교함을 바꾸면 알리고, 다른 키는 무시한다", async () => {
    stubStorage();
    const store = await load();
    const onChange = vi.fn();
    store.subscribeCompare(onChange);
    const storageEvent = (key: string | null) =>
      Object.assign(new Event("storage"), { key });
    window.dispatchEvent(storageEvent("other"));
    expect(onChange).not.toHaveBeenCalled();
    window.dispatchEvent(storageEvent("nuti_compare_v1"));
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
    expect(store.addToCompare(item("1"))).toBe("added");
    expect(store.addToCompare(item("2"))).toBe("added");
    expect(store.readCompare().map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("저장소를 아예 못 읽으면 빈 비교함으로 본다", async () => {
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
    expect(store.readCompare()).toEqual([]);
    expect(store.addToCompare(item("1"))).toBe("added");
    expect(store.readCompare().map((i) => i.id)).toEqual(["1"]);
  });
});
