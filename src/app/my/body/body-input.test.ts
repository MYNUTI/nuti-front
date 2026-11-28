import { describe, expect, it } from "vitest";

import { EMPTY_BODY_INPUT, type BodyInput, validateBody } from "./body-input";

const NOW = new Date(2026, 10, 25);
const VALID: BodyInput = {
  gender: "MALE",
  birthYear: "1998",
  heightCm: "175",
  weightKg: "70",
  activity: "LOW_ACTIVE",
};

describe("validateBody", () => {
  it("맞는 값은 숫자로 바꿔 돌려준다", () => {
    expect(validateBody(VALID, NOW)).toEqual({
      ok: true,
      profile: {
        gender: "MALE",
        birthYear: 1998,
        heightCm: 175,
        weightKg: 70,
        activity: "LOW_ACTIVE",
      },
    });
  });

  it("빈 칸은 칸마다 적어 달라고 한다", () => {
    expect(validateBody(EMPTY_BODY_INPUT, NOW)).toEqual({
      ok: false,
      errors: {
        gender: "성별을 골라 주세요",
        birthYear: "출생 연도를 적어 주세요",
        heightCm: "키를 적어 주세요",
        weightKg: "체중을 적어 주세요",
      },
    });
  });

  it("공백만 있으면 빈 칸으로 본다", () => {
    const result = validateBody({ ...VALID, heightCm: "  " }, NOW);
    expect(result.ok || result.errors.heightCm).toBe("키를 적어 주세요");
  });

  it("출생 연도는 1900부터 만 14세가 되는 해까지", () => {
    const year = (birthYear: string) =>
      validateBody({ ...VALID, birthYear }, NOW).ok;
    expect(year("1900")).toBe(true);
    expect(year("2012")).toBe(true);
    expect(year("1899")).toBe(false);
    expect(year("2013")).toBe(false);
    expect(year("1998.5")).toBe(false);
    const result = validateBody({ ...VALID, birthYear: "2013" }, NOW);
    expect(result.ok || result.errors.birthYear).toBe(
      "1900~2012년 사이로 적어 주세요",
    );
  });

  it("키는 100~250cm, 체중은 25~250kg(경계 포함 · 소수 허용)", () => {
    const ok = (patch: Partial<BodyInput>) =>
      validateBody({ ...VALID, ...patch }, NOW).ok;
    expect(ok({ heightCm: "100" })).toBe(true);
    expect(ok({ heightCm: "250" })).toBe(true);
    expect(ok({ heightCm: "172.5" })).toBe(true);
    expect(ok({ heightCm: "99.9" })).toBe(false);
    expect(ok({ heightCm: "251" })).toBe(false);
    expect(ok({ weightKg: "25" })).toBe(true);
    expect(ok({ weightKg: "250" })).toBe(true);
    expect(ok({ weightKg: "24" })).toBe(false);
    expect(ok({ weightKg: "abc" })).toBe(false);
  });

  it("숫자 · 소수점만 받는다(지수 · 16진수 · 2진수 · 소수점 여럿 · 음수 · 0은 범위 오류)", () => {
    const ok = (patch: Partial<BodyInput>) =>
      validateBody({ ...VALID, ...patch }, NOW).ok;
    for (const heightCm of [
      "0",
      "-175",
      "1e2",
      "0x64",
      "0b1100100",
      "1.7.5",
      "Infinity",
      "250.1",
      "175cm",
    ])
      expect(ok({ heightCm })).toBe(false);
    expect(ok({ weightKg: "250.1" })).toBe(false);
    expect(ok({ birthYear: "2e3" })).toBe(false);
    expect(ok({ birthYear: "0x7ce" })).toBe(false);
  });

  it("소수 둘째 자리부터는 한 자리로 반올림한다(백엔드 저장 칸이 소수 한 자리)", () => {
    const result = validateBody(
      { ...VALID, heightCm: "172.55", weightKg: "65.04" },
      NOW,
    );
    expect(result.ok && result.profile).toMatchObject({
      heightCm: 172.6,
      weightKg: 65,
    });
    // 반올림해서 상한을 넘으면 범위 오류
    expect(validateBody({ ...VALID, heightCm: "250.05" }, NOW).ok).toBe(false);
  });

  it("전각 숫자도 받는다", () => {
    const result = validateBody(
      { ...VALID, birthYear: "１９９８", heightCm: "１７５" },
      NOW,
    );
    expect(result.ok && result.profile).toMatchObject({
      birthYear: 1998,
      heightCm: 175,
    });
  });

  it("「올해」는 한국 시간 기준이다", () => {
    // UTC 2026-12-31 16:00 = 한국 2027-01-01 01:00 → 2013년생까지
    const newYearInKorea = new Date(Date.UTC(2026, 11, 31, 16));
    expect(
      validateBody({ ...VALID, birthYear: "2013" }, newYearInKorea).ok,
    ).toBe(true);
  });
});
