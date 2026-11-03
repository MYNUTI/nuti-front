import { describe, expect, it } from "vitest";
import {
  toBootstrap,
  toHealthConsent,
  toSampleProducts,
} from "@/lib/onboarding/mapper";
import type { BootstrapDto } from "@/lib/onboarding/types";

const bootstrap: BootstrapDto = {
  isLoggedIn: false,
  consentAgreed: true,
  healthConsented: false,
  onboardingCompleted: true,
  goal: "GENERAL",
  clipboardLinkDetection: true,
  currentPolicyVersion: "2026-10",
};

describe("onboarding mapper", () => {
  it("정책이 없어 버전이 빠지면 null이다", () => {
    expect(toBootstrap(bootstrap).currentPolicyVersion).toBe("2026-10");
    const { currentPolicyVersion: _, ...withoutVersion } = bootstrap;
    void _;
    expect(toBootstrap(withoutVersion).currentPolicyVersion).toBeNull();
  });

  it("미동의면 agreedAt이 null이다", () => {
    expect(toHealthConsent({ healthConsented: false })).toEqual({
      healthConsented: false,
      agreedAt: null,
    });
    expect(
      toHealthConsent({
        healthConsented: true,
        agreedAt: "2026-11-03T10:00:00",
      }),
    ).toEqual({ healthConsented: true, agreedAt: "2026-11-03T10:00:00" });
  });

  it("샘플 상품 ID를 문자열로 바꾼다", () => {
    expect(
      toSampleProducts({
        items: [{ productId: 3, name: "두유", imageUrl: null, grade: "A" }],
      }),
    ).toEqual([{ id: "3", name: "두유", imageUrl: null, grade: "A" }]);
  });
});
