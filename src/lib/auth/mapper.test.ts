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
      newUser: true,
      mergedRecordCount: 0,
      user: { id: "5", email: null, nickname: "누티", provider: "KAKAO" },
    });
  });
});
