import { describe, expect, it, vi } from "vitest";

import {
  catchInstallPrompt,
  getInstallPrompt,
  showInstallPrompt,
  subscribeInstallPrompt,
} from "./install-prompt";

function fakeEvent(outcome: "accepted" | "dismissed") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  return Object.assign(event, {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome }),
  });
}

describe("설치 창 신호", () => {
  it("받아 두면 브라우저 기본 띠를 막고, 한 번 띄운 뒤 지운다", async () => {
    const event = fakeEvent("accepted");
    catchInstallPrompt(event);
    expect(event.defaultPrevented).toBe(true);
    expect(getInstallPrompt()).toBe(event);

    await expect(showInstallPrompt()).resolves.toBe("accepted");
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(getInstallPrompt()).toBeNull();
    await expect(showInstallPrompt()).resolves.toBe("unavailable");
  });

  it("취소하면 dismissed", async () => {
    catchInstallPrompt(fakeEvent("dismissed"));
    await expect(showInstallPrompt()).resolves.toBe("dismissed");
  });
});

describe("설치 창 신호 구독", () => {
  it("새 신호가 오면 알리고 앞선 신호를 바꾼다", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeInstallPrompt(listener);
    const first = fakeEvent("dismissed");
    const second = fakeEvent("accepted");
    catchInstallPrompt(first);
    catchInstallPrompt(second);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(getInstallPrompt()).toBe(second);

    await showInstallPrompt();
    // 띄워서 비운 것도 알린다
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
    catchInstallPrompt(fakeEvent("accepted"));
    expect(listener).toHaveBeenCalledTimes(3);
    await showInstallPrompt();
  });
});
