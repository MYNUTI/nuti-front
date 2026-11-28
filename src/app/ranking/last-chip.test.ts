import { afterEach, describe, expect, it, vi } from "vitest";

import { stubLocalStorage } from "@/test/browser";

import { readLastChip, writeLastChip } from "./last-chip";

const MAJORS = [
  {
    code: "01",
    name: "다이어트 · 단백질",
    chips: [{ code: "01S4", name: "프로틴바" }],
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("마지막에 본 중분류", () => {
  it("쓴 칩을 다시 읽는다", () => {
    stubLocalStorage();
    writeLastChip("01S4");
    expect(readLastChip(MAJORS)).toBe("01S4");
  });

  it("없어졌거나 닫힌 칩(분류 목록에 없음)이면 버린다", () => {
    stubLocalStorage({ nuti_ranking_last_v1: "9999" });
    expect(readLastChip(MAJORS)).toBeNull();
  });

  it("저장소가 막혔으면 읽기는 null, 쓰기는 조용히 넘어간다", () => {
    const blocked = () => {
      throw new Error("SecurityError");
    };
    vi.stubGlobal("localStorage", { getItem: blocked, setItem: blocked });
    expect(readLastChip(MAJORS)).toBeNull();
    expect(() => writeLastChip("01S4")).not.toThrow();
  });
});
