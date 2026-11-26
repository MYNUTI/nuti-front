import { afterEach, describe, expect, it, vi } from "vitest";

import { stubLocalStorage } from "@/test/browser";

import { addRequestedHere, isRequestedHere } from "./requested-gtins";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("이 기기에서 요청한 바코드", () => {
  it("보낸 바코드를 기억하고, 같은 바코드는 한 번만 둔다", () => {
    const store = stubLocalStorage();
    addRequestedHere("08801000000036");
    addRequestedHere("08801000000043");
    addRequestedHere("08801000000036");
    expect(isRequestedHere("08801000000036")).toBe(true);
    expect(isRequestedHere("08801234567893")).toBe(false);
    expect(JSON.parse(store.get("nuti_requested_gtins_v1")!)).toEqual([
      "08801000000036",
      "08801000000043",
    ]);
  });

  it("깨진 값 · 14자리가 아닌 값은 버리고, 저장소가 막혔으면 조용히 넘어간다", () => {
    stubLocalStorage({
      nuti_requested_gtins_v1: '["123", 5, "08801000000036"]',
    });
    expect(isRequestedHere("08801000000036")).toBe(true);
    stubLocalStorage({ nuti_requested_gtins_v1: "{" });
    expect(isRequestedHere("08801000000036")).toBe(false);
    const blocked = () => {
      throw new Error("SecurityError");
    };
    vi.stubGlobal("localStorage", { getItem: blocked, setItem: blocked });
    expect(isRequestedHere("08801000000036")).toBe(false);
    expect(() => addRequestedHere("08801000000036")).not.toThrow();
  });

  it("50개를 넘으면 오래된 것부터 버린다", () => {
    stubLocalStorage();
    const gtins = Array.from(
      { length: 51 },
      (_, i) => `0880100000${String(i).padStart(4, "0")}`,
    );
    for (const gtin of gtins) addRequestedHere(gtin);
    expect(isRequestedHere(gtins[0])).toBe(false);
    expect(isRequestedHere(gtins[1])).toBe(true);
    expect(isRequestedHere(gtins[50])).toBe(true);
  });
});
