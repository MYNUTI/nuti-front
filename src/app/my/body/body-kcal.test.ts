import { describe, expect, it } from "vitest";

import type { BodyProfile } from "./body-input";
import { ageOf, estimateDailyKcal, toKcalBand } from "./body-kcal";

const NOW = new Date(2026, 10, 25);
const MAN: BodyProfile = {
  gender: "MALE",
  birthYear: 1998,
  heightCm: 175,
  weightKg: 70,
  activity: "LOW_ACTIVE",
};

describe("estimateDailyKcal", () => {
  it("나이는 한국 시간 올해 − 출생 연도", () => {
    expect(ageOf(MAN, NOW)).toBe(28);
    // UTC 2026-12-31 15:00 = 한국 2027-01-01 00:00
    expect(ageOf(MAN, new Date(Date.UTC(2026, 11, 31, 15)))).toBe(29);
  });

  // 활동량 계수(PaLevel) 8개를 모두 값으로 고정한다. 괄호 안: 남성 28세 175cm 70kg = 1791.16, 여성 28세 162cm 55kg = 1497.44
  it.each([
    ["MALE", "SEDENTARY", 2450], // 662 + 1.00 × 1791.16 = 2453.16
    ["MALE", "LOW_ACTIVE", 2650], // 662 + 1.11 × 1791.16 = 2650.19
    ["MALE", "ACTIVE", 2900], // 662 + 1.25 × 1791.16 = 2900.95
    ["MALE", "VERY_ACTIVE", 3310], // 662 + 1.48 × 1791.16 = 3312.92
    ["FEMALE", "SEDENTARY", 1850], // 354 + 1.00 × 1497.44 = 1851.44
    ["FEMALE", "LOW_ACTIVE", 2030], // 354 + 1.12 × 1497.44 = 2031.13
    ["FEMALE", "ACTIVE", 2260], // 354 + 1.27 × 1497.44 = 2255.75
    ["FEMALE", "VERY_ACTIVE", 2530], // 354 + 1.45 × 1497.44 = 2525.29
  ] as const)("%s %s → %i", (gender, activity, expected) => {
    const body: BodyProfile =
      gender === "MALE"
        ? { ...MAN, activity }
        : {
            gender,
            birthYear: 1998,
            heightCm: 162,
            weightKg: 55,
            activity,
          };
    expect(estimateDailyKcal(body, NOW)).toBe(expected);
  });

  it("백엔드 EerCalculator와 같은 산식 · 10kcal 단위 반올림", () => {
    // 662 + 1.11 × (−9.53×28 + 15.91×70 + 539.6×1.75) = 2650.19
    expect(estimateDailyKcal(MAN, NOW)).toBe(2650);
    // 354 + 1.27 × (−6.91×31 + 9.36×55 + 726×1.62) = 2229.42
    expect(
      estimateDailyKcal(
        {
          gender: "FEMALE",
          birthYear: 1995,
          heightCm: 162,
          weightKg: 55,
          activity: "ACTIVE",
        },
        NOW,
      ),
    ).toBe(2230);
  });

  it("활동량이 많을수록 높다", () => {
    const kcal = (activity: BodyProfile["activity"]) =>
      estimateDailyKcal({ ...MAN, activity }, NOW);
    expect(kcal("SEDENTARY")).toBeLessThan(kcal("LOW_ACTIVE"));
    expect(kcal("ACTIVE")).toBeLessThan(kcal("VERY_ACTIVE"));
  });
});

describe("toKcalBand", () => {
  it("가장 가까운 기준, 가운데는 위로", () => {
    expect(toKcalBand(1740)).toBe(1500);
    expect(toKcalBand(1750)).toBe(2000);
    expect(toKcalBand(2240)).toBe(2000);
    expect(toKcalBand(2250)).toBe(2500);
    expect(toKcalBand(2650)).toBe(2500);
    expect(toKcalBand(2750)).toBe(3000);
  });

  it("범위 밖은 끝 값", () => {
    expect(toKcalBand(900)).toBe(1500);
    expect(toKcalBand(4200)).toBe(3000);
  });
});
