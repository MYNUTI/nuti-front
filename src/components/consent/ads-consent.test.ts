import { describe, expect, it } from "vitest";

import { adsConsentMessage } from "./ads-consent";

describe("adsConsentMessage", () => {
  const day = new Date(2026, 10, 23);

  it("동의 · 철회에 그날 날짜를 붙인다", () => {
    expect(adsConsentMessage(true, day)).toBe(
      "11월 23일 마이뉴티 광고성 정보 수신에 동의했어요",
    );
    expect(adsConsentMessage(false, day)).toBe(
      "11월 23일 마이뉴티 광고성 정보 수신을 철회했어요",
    );
  });

  it("월 · 일 앞에 0을 붙이지 않는다", () => {
    expect(adsConsentMessage(true, new Date(2026, 0, 5))).toMatch(/^1월 5일 /);
  });

  it("연말 · 하루 끝도 그날 로컬 날짜로 쓴다", () => {
    expect(
      adsConsentMessage(false, new Date(2026, 11, 31, 23, 59, 59)),
    ).toMatch(/^12월 31일 /);
    expect(adsConsentMessage(true, new Date(2026, 1, 28, 23, 59, 59))).toMatch(
      /^2월 28일 /,
    );
  });
});
