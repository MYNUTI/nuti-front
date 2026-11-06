import { afterEach, describe, expect, it, vi } from "vitest";

import { detectCameraPlace } from "./camera-place";

const UA = {
  kakaoIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.8.0",
  kakaoAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 KAKAOTALK 10.8.0",
  instagramIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0",
  instagramAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 Instagram 350.0",
  safariIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  chromeDesktop:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
};

// 터치 기기는 any-pointer: coarse, 마우스만 있으면 pointer: fine만 맞는다
function stubDevice(userAgent: string, input: "touch" | "mouse" | "both") {
  vi.stubGlobal("navigator", { userAgent });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches:
      query === "(any-pointer: coarse)"
        ? input !== "mouse"
        : query === "(pointer: fine)"
          ? input !== "touch"
          : false,
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detectCameraPlace", () => {
  it.each([
    ["카카오톡 iOS", UA.kakaoIos, "카카오톡", true],
    ["카카오톡 Android", UA.kakaoAndroid, "카카오톡", true],
    ["인스타그램 iOS", UA.instagramIos, "인스타그램", false],
    ["인스타그램 Android", UA.instagramAndroid, "인스타그램", true],
  ])(
    "%s는 앱 안 브라우저로 보고, 바깥으로 열 수 있는지 알려 준다",
    (_, ua, app, canOpen) => {
      stubDevice(ua, "touch");
      const place = detectCameraPlace();
      expect(place).toMatchObject({ kind: "in-app", app });
      expect(place.kind === "in-app" && Boolean(place.openExternal)).toBe(
        canOpen,
      );
    },
  );

  it("카카오톡은 카카오톡 주소로 바깥 브라우저를 연다", () => {
    stubDevice(UA.kakaoIos, "touch");
    const place = detectCameraPlace();
    expect(
      place.kind === "in-app" && place.openExternal?.("https://a.kr/scan"),
    ).toBe("kakaotalk://web/openExternal?url=https%3A%2F%2Fa.kr%2Fscan");
  });

  it("안드로이드의 다른 앱은 크롬 intent 주소로 연다", () => {
    stubDevice(UA.instagramAndroid, "touch");
    const place = detectCameraPlace();
    expect(
      place.kind === "in-app" && place.openExternal?.("https://a.kr/scan"),
    ).toBe(
      "intent://a.kr/scan#Intent;scheme=https;package=com.android.chrome;end",
    );
  });

  it.each([
    ["아이폰 사파리", UA.safariIos, "touch"],
    ["터치 노트북", UA.chromeDesktop, "both"],
  ] as const)("%s는 카메라를 열 수 있는 곳이다", (_, ua, input) => {
    stubDevice(ua, input);
    expect(detectCameraPlace()).toEqual({ kind: "ok" });
  });

  it("터치 없이 마우스만 있으면 PC다", () => {
    stubDevice(UA.chromeDesktop, "mouse");
    expect(detectCameraPlace()).toEqual({ kind: "pc" });
  });
});
