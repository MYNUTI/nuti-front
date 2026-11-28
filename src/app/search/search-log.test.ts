import { describe, expect, it, vi } from "vitest";

async function fresh() {
  vi.resetModules();
  return import("./search-log");
}

describe("검색 로그 시점", () => {
  it("페이지를 처음 연 결과 화면은 보내고, 그 뒤 다시 붙으면(뒤로 · 앞으로) 보내지 않는다", async () => {
    const log = await fresh();
    expect(log.shouldLogSearch("두유")).toBe(true);
    log.settleSearchLog("두유");
    expect(log.shouldLogSearch("두유")).toBe(false);
  });

  it("검색칸에서 검색해 온 검색어는 보내고, 받은 뒤에는 지운다", async () => {
    const log = await fresh();
    log.settleSearchLog("처음");
    log.markSearchLog("프로틴바");
    expect(log.shouldLogSearch("프로틴바")).toBe(true);
    expect(log.shouldLogSearch("두유")).toBe(false);
    log.settleSearchLog("프로틴바");
    expect(log.shouldLogSearch("프로틴바")).toBe(false);
  });

  it("값을 읽기만 해서 두 번 물어도 같다", async () => {
    const log = await fresh();
    log.settleSearchLog("처음");
    log.markSearchLog("두유");
    expect(log.shouldLogSearch("두유")).toBe(true);
    expect(log.shouldLogSearch("두유")).toBe(true);
  });
});
