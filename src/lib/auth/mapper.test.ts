import { describe, expect, it } from "vitest";
import { toLoginResult } from "@/lib/auth/mapper";

describe("toLoginResult", () => {
  it("병합 건수가 빠지면 0, 사용자 ID는 문자열이다", () => {
    expect(
      toLoginResult({
        accessToken: "a",
        refreshToken: "r",
        newUser: true,
        user: { id: 5, email: null, nickname: "누티", provider: "KAKAO" },
      }),
    ).toEqual({
      status: "SIGNED_IN",
      newUser: true,
      mergedRecordCount: 0,
      merged: null,
      user: { id: "5", email: null, nickname: "누티", provider: "KAKAO" },
    });
  });

  it("종류별 병합 수를 담는다", () => {
    const merged = {
      savedProducts: 3,
      goals: 1,
      history: 12,
      analysisRequests: 2,
      reports: 0,
    };
    expect(
      toLoginResult({
        accessToken: "a",
        refreshToken: "r",
        newUser: false,
        merged,
        mergedRecordCount: 18,
      }),
    ).toMatchObject({ status: "SIGNED_IN", mergedRecordCount: 18, merged });
  });

  it("처음 로그인이면 가입 토큰과 회사 계정 정보만 담는다", () => {
    expect(
      toLoginResult({
        signupRequired: true,
        signupToken: "signup-1",
        signupProfile: {
          provider: "KAKAO",
          email: "ab@kakao.com",
          nickname: "누티",
        },
        accessToken: null,
        refreshToken: null,
        newUser: false,
      }),
    ).toEqual({
      status: "SIGNUP_REQUIRED",
      signupToken: "signup-1",
      profile: { provider: "KAKAO", email: "ab@kakao.com", nickname: "누티" },
    });
  });
});
