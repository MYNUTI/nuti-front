import { describe, expect, it } from "vitest";

import {
  afterClose,
  detectHomeScreenPlatform,
  EMPTY_RECORD,
  parseRecord,
  shouldShowPrompt,
} from "./home-screen-prompt-rules";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1";
const SAMSUNG =
  "Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const KAKAO_IPHONE = `${IPHONE_SAFARI} KAKAOTALK 10.8.0`;
const DESKTOP_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const detect = (userAgent: string, more = {}) =>
  detectHomeScreenPlatform({
    userAgent,
    standalone: false,
    canPrompt: false,
    ...more,
  });

describe("detectHomeScreenPlatform", () => {
  it("설치 창 신호가 있으면 안드로이드 시트", () => {
    expect(detect(ANDROID_CHROME, { canPrompt: true })).toBe("android");
    // 삼성 인터넷도 신호를 주면 안드로이드 시트(메모 「실기기에서 확인할 것」)
    expect(detect(SAMSUNG, { canPrompt: true })).toBe("android");
  });

  it("신호가 없으면 삼성 인터넷 · 아이폰 사파리만 따라 하기 시트", () => {
    expect(detect(SAMSUNG)).toBe("samsung");
    expect(detect(IPHONE_SAFARI)).toBe("ios");
    expect(detect(IPHONE_CHROME)).toBeNull();
    expect(detect(ANDROID_CHROME)).toBeNull();
  });

  it("PC는 설치 창 신호가 있어도 띄우지 않는다", () => {
    expect(detect(DESKTOP_CHROME, { canPrompt: true })).toBeNull();
  });

  it("홈 화면 아이콘으로 열었거나 앱 안 브라우저면 띄우지 않는다", () => {
    expect(detect(IPHONE_SAFARI, { standalone: true })).toBeNull();
    expect(detect(KAKAO_IPHONE)).toBeNull();
    expect(
      detect(ANDROID_CHROME, { canPrompt: true, standalone: true }),
    ).toBeNull();
  });
});

describe("shouldShowPrompt", () => {
  const day = 24 * 60 * 60 * 1000;

  it("처음엔 띄우고, 닫은 뒤 14일 동안은 띄우지 않는다", () => {
    expect(shouldShowPrompt(EMPTY_RECORD, 0)).toBe(true);
    const once = afterClose(EMPTY_RECORD, 1_000);
    expect(shouldShowPrompt(once, 1_000 + 13 * day)).toBe(false);
    expect(shouldShowPrompt(once, 1_000 + 14 * day)).toBe(true);
  });

  it("두 번 닫은 뒤에도 14일이 지나면 한 번 더", () => {
    const twice = afterClose(afterClose(EMPTY_RECORD, 0), 20 * day);
    expect(shouldShowPrompt(twice, 40 * day)).toBe(true);
  });

  it("다시 띄우기는 2번까지(모두 3번)", () => {
    let record = EMPTY_RECORD;
    for (let i = 0; i < 3; i++) record = afterClose(record, i * 20 * day);
    expect(shouldShowPrompt(record, 100 * day)).toBe(false);
  });

  it("설치했으면 띄우지 않는다", () => {
    expect(shouldShowPrompt({ ...EMPTY_RECORD, installed: true }, 0)).toBe(
      false,
    );
  });
});

describe("parseRecord", () => {
  it("맞는 모양만 받는다", () => {
    expect(parseRecord('{"shown":1,"closedAt":100,"installed":false}')).toEqual(
      { shown: 1, closedAt: 100, installed: false },
    );
  });

  it("모양이 다르면 처음처럼 본다", () => {
    for (const raw of [
      null,
      "",
      "깨진 값",
      '{"shown":"1","closedAt":100,"installed":false}',
      '{"shown":1,"closedAt":100,"installed":"false"}',
      '{"shown":-1,"closedAt":100,"installed":false}',
      '{"shown":1.5,"closedAt":100,"installed":false}',
    ])
      expect(parseRecord(raw)).toEqual(EMPTY_RECORD);
  });
});
