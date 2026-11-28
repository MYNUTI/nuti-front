import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearDeviceGoal,
  readDeviceGoal,
  saveDeviceGoal,
} from "@/lib/goal/device";
import { DEVICE_GOAL_COOKIE } from "@/lib/goal/device-cookie";
import { stubDocumentCookie } from "@/test/browser";

describe("기기 목표", () => {
  afterEach(() => {
    clearDeviceGoal();
    vi.unstubAllGlobals();
  });

  it("고른 적이 없으면 null이다", () => {
    stubDocumentCookie();
    expect(readDeviceGoal()).toBeNull();
  });

  it("400일 쿠키로 저장하고 읽는다", () => {
    const cookies = stubDocumentCookie();
    saveDeviceGoal("MUSCLE_GAIN");
    expect(cookies.writes.at(-1)).toBe(
      `${DEVICE_GOAL_COOKIE}=MUSCLE_GAIN; Path=/; Max-Age=34560000; SameSite=lax`,
    );
    expect(readDeviceGoal()).toBe("MUSCLE_GAIN");
  });

  it("쿠키 값이 목표가 아니면 없는 것으로 본다", () => {
    stubDocumentCookie({ [DEVICE_GOAL_COOKIE]: "GENERAL" });
    expect(readDeviceGoal()).toBeNull();
  });

  it("쿠키를 쓸 수 없어도 이번 사용 동안은 기억한다", () => {
    stubDocumentCookie();
    vi.stubGlobal("document", {
      get cookie() {
        return "";
      },
      set cookie(_: string) {},
    });
    saveDeviceGoal("MUSCLE_GAIN");
    expect(readDeviceGoal()).toBe("MUSCLE_GAIN");
  });

  it("저장한 뒤 다른 곳(다른 탭의 탈퇴, 브라우저)에서 쿠키가 지워지면 null이다", () => {
    stubDocumentCookie();
    saveDeviceGoal("MUSCLE_GAIN");
    document.cookie = `${DEVICE_GOAL_COOKIE}=; Path=/; Max-Age=0`;
    expect(readDeviceGoal()).toBeNull();
  });

  it("지우면 처음 방문 상태(null)로 돌아간다", () => {
    stubDocumentCookie();
    saveDeviceGoal("MUSCLE_GAIN");
    clearDeviceGoal();
    expect(readDeviceGoal()).toBeNull();
  });
});
