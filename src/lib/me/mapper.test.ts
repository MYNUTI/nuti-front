import { describe, expect, it } from "vitest";
import { toMeSettings, toMeSummary, toPolicies, toUser } from "@/lib/me/mapper";

describe("me mapper", () => {
  it("비로그인 마이는 profile·footerNotice가 빠지면 null이고 목표 code를 goal로 바꾼다", () => {
    expect(
      toMeSummary({
        isLoggedIn: false,
        goal: { code: "GENERAL", label: "일반" },
        recordCount: 3,
        contribution: { requestCount: 1, publishedCount: 0 },
      }),
    ).toEqual({
      isLoggedIn: false,
      profile: null,
      goal: { goal: "GENERAL", label: "일반" },
      recordCount: 3,
      contribution: { requestCount: 1, publishedCount: 0 },
      footerNotice: null,
    });
  });

  it("내 정보 ID를 문자열로 바꾼다", () => {
    expect(
      toUser({
        id: 5,
        email: null,
        nickname: "누티",
        provider: "KAKAO",
        role: "USER",
        createdAt: "2026-11-03T10:00:00",
      }),
    ).toMatchObject({ id: "5", email: null });
  });

  it("설정의 정책·고객센터 URL이 빠지면 null이다", () => {
    expect(
      toMeSettings({
        clipboardLinkDetection: true,
        goal: { code: "WEIGHT_LOSS", label: "체중 감량" },
        policies: { privacyUrl: "https://nuti.example/privacy" },
        appVersion: "2.0.0-web",
      }),
    ).toEqual({
      clipboardLinkDetection: true,
      goal: { goal: "WEIGHT_LOSS", label: "체중 감량" },
      privacyUrl: "https://nuti.example/privacy",
      termsUrl: null,
      supportUrl: null,
      appVersion: "2.0.0-web",
    });
  });

  it("정책이 없으면 null이다", () => {
    expect(toPolicies({})).toEqual({ privacy: null, terms: null });
  });
});
