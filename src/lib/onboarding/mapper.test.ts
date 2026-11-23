import { describe, expect, it } from "vitest";
import { toBootstrap } from "@/lib/onboarding/mapper";

describe("onboarding mapper", () => {
  it("정책이 없어 버전이 빠지거나 몸 정보가 없어 칼로리 구간이 빠지면 null이다", () => {
    expect(
      toBootstrap({
        isLoggedIn: false,
        goalAccountConsented: false,
        bodyProfileConsented: false,
        marketingConsented: false,
        goal: "WEIGHT_LOSS",
      }),
    ).toEqual({
      isLoggedIn: false,
      goalAccountConsented: false,
      bodyProfileConsented: false,
      marketingConsented: false,
      goal: "WEIGHT_LOSS",
      kcalBand: null,
      currentPolicyVersion: null,
    });
  });

  it("동의한 계정의 칼로리 구간과 현재 정책 판을 담는다", () => {
    expect(
      toBootstrap({
        isLoggedIn: true,
        goalAccountConsented: true,
        bodyProfileConsented: true,
        marketingConsented: false,
        kcalBand: 2500,
        goal: "MUSCLE_GAIN",
        currentPolicyVersion: "2026-11",
      }),
    ).toMatchObject({ kcalBand: 2500, currentPolicyVersion: "2026-11" });
  });
});
