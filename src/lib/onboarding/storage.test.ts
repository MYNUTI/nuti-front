import { afterEach, describe, expect, it, vi } from "vitest";
import {
  forgetOnboardingCompleted,
  isOnboardingCompletedLocally,
  rememberOnboardingCompleted,
} from "@/lib/onboarding/storage";

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
}

describe("기기 온보딩 완료 기록", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("기억하면 완료이고, 잊으면 처음 실행 상태로 돌아간다", () => {
    stubLocalStorage();
    expect(isOnboardingCompletedLocally()).toBe(false);
    rememberOnboardingCompleted();
    expect(isOnboardingCompletedLocally()).toBe(true);
    forgetOnboardingCompleted();
    expect(isOnboardingCompletedLocally()).toBe(false);
  });

  it("localStorage 접근이 던져도 실패하지 않고 완료가 아닌 것으로 본다", () => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    vi.stubGlobal("localStorage", {
      getItem: blocked,
      setItem: blocked,
      removeItem: blocked,
    });
    expect(isOnboardingCompletedLocally()).toBe(false);
    expect(() => rememberOnboardingCompleted()).not.toThrow();
    expect(() => forgetOnboardingCompleted()).not.toThrow();
  });
});
