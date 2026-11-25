import { afterEach, describe, expect, it, vi } from "vitest";

import { stubLocalStorage } from "@/test/browser";

import {
  clearPendingGtin,
  readPendingGtin,
  writePendingGtin,
} from "./pending-gtin";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("조회하지 못한 바코드", () => {
  it("쓴 바코드를 읽고, 지우면 null", () => {
    stubLocalStorage();
    vi.stubGlobal("window", {});
    writePendingGtin("08801062633029");
    expect(readPendingGtin()).toBe("08801062633029");
    clearPendingGtin();
    expect(readPendingGtin()).toBeNull();
  });

  it("14자리 숫자가 아니면 버린다", () => {
    stubLocalStorage({ nuti_scan_pending_v1: "8801062633029" });
    vi.stubGlobal("window", {});
    expect(readPendingGtin()).toBeNull();
  });

  it("저장소가 막혔으면 읽기는 null, 쓰기 · 지우기는 조용히 넘어간다", () => {
    const blocked = () => {
      throw new Error("SecurityError");
    };
    vi.stubGlobal("localStorage", {
      getItem: blocked,
      setItem: blocked,
      removeItem: blocked,
    });
    vi.stubGlobal("window", {});
    expect(readPendingGtin()).toBeNull();
    expect(() => writePendingGtin("08801062633029")).not.toThrow();
    expect(() => clearPendingGtin()).not.toThrow();
  });
});
