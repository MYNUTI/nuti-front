import { type BodyProfile, koreanYear } from "./body-input";

/*
 * 5-7b 하루 필요 칼로리(EER)와 점수 기준 구간. 백엔드는 기기가 계산한 값을 받아 구간만 정하므로(BodyProfileService)
 * 산식은 백엔드 `EerCalculator` · `PaLevel`(KDRI 2025)을 그대로 옮겼다.
 *   EER = α + PA × (β × 나이 + γ × 체중 + δ × 키(m))
 * 나이는 출생 연도만 받아 「한국 시간 올해 − 출생 연도」로 센다(【최종】 1998년생 → 2026년 28세).
 */

const COEFFICIENT = {
  MALE: { a: 662, b: -9.53, c: 15.91, d: 539.6 },
  FEMALE: { a: 354, b: -6.91, c: 9.36, d: 726 },
} as const;

const PA = {
  SEDENTARY: { MALE: 1, FEMALE: 1 },
  LOW_ACTIVE: { MALE: 1.11, FEMALE: 1.12 },
  ACTIVE: { MALE: 1.25, FEMALE: 1.27 },
  VERY_ACTIVE: { MALE: 1.48, FEMALE: 1.45 },
} as const;

/** 점수에 쓰는 하루 칼로리 기준 네 단계 */
export const KCAL_BANDS = [1500, 2000, 2500, 3000] as const;
export type KcalBand = (typeof KCAL_BANDS)[number];

export function ageOf(profile: BodyProfile, now = new Date()) {
  return koreanYear(now) - profile.birthYear;
}

/** 하루 필요 칼로리. 10kcal 단위로 반올림한다(메모). 계정에 보내는 `dailyKcal`도 이 값 */
export function estimateDailyKcal(profile: BodyProfile, now = new Date()) {
  const { a, b, c, d } = COEFFICIENT[profile.gender];
  const pa = PA[profile.activity][profile.gender];
  const eer =
    a +
    pa *
      (b * ageOf(profile, now) +
        c * profile.weightKg +
        d * (profile.heightCm / 100));
  return Math.round(eer / 10) * 10;
}

/** 가장 가까운 기준. 가운데(1,750 · 2,250 · 2,750)는 위로, 범위 밖은 끝 값(백엔드 `toBand`와 같음) */
export function toKcalBand(kcal: number): KcalBand {
  if (kcal <= 1500) return 1500;
  if (kcal >= 3000) return 3000;
  return KCAL_BANDS[Math.floor((kcal - 1500) / 500 + 0.5)];
}
