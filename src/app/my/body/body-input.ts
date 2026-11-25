/*
 * 5-7 내 몸에 맞추기 입력 값과 검사. 값 이름 · 범위는 백엔드 `PUT /me/body-profile`(BodyProfileRequest · BodyProfileService)과 같다.
 * 범위: 출생 연도 1900 ~ 만 14세가 되는 해, 키 100~250cm, 체중 25~250kg.
 * 범위 밖 문장은 【최종】 메모가 「ACCT_010 표대로」인데 그 표를 열지 못해 임시 문장이다(UI 플랜 「남은 질문」).
 */

export type Gender = "MALE" | "FEMALE";
export type ActivityLevel =
  "SEDENTARY" | "LOW_ACTIVE" | "ACTIVE" | "VERY_ACTIVE";

/** 화면에 적힌 그대로의 값(숫자 칸은 글자) */
export type BodyInput = {
  gender: Gender | null;
  birthYear: string;
  heightCm: string;
  weightKg: string;
  activity: ActivityLevel;
};

export type BodyProfile = {
  gender: Gender;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
};

export type BodyField = "gender" | "birthYear" | "heightCm" | "weightKg";
export type BodyErrors = Partial<Record<BodyField, string>>;

/** 화면 위에서 아래 순서. 오류가 있으면 이 순서로 첫 칸에 초점을 준다 */
export const BODY_FIELDS: BodyField[] = [
  "gender",
  "birthYear",
  "heightCm",
  "weightKg",
];

const MIN_BIRTH_YEAR = 1900;
const MIN_AGE = 14;
const HEIGHT = { min: 100, max: 250 };
const WEIGHT = { min: 25, max: 250 };

/** 처음 입력: 칸은 비우고 활동량은 「조금 움직여요」를 미리 고른다(메모) */
export const EMPTY_BODY_INPUT: BodyInput = {
  gender: null,
  birthYear: "",
  heightCm: "",
  weightKg: "",
  activity: "LOW_ACTIVE",
};

export function toBodyInput(profile: BodyProfile): BodyInput {
  return {
    gender: profile.gender,
    birthYear: String(profile.birthYear),
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg),
    activity: profile.activity,
  };
}

const YEAR = /^\d{4}$/;
const DECIMAL = /^\d+(\.\d+)?$/;

/**
 * 칸 글자를 숫자로. 빈 칸은 null, 형식이 틀리면 NaN(범위 검사에서 걸린다).
 * `Number()`는 0x64 · 1e2 같은 표기도 받아서 숫자 · 소수점만 받는다. 전각 숫자(１７５)는 NFKC로 보통 숫자로 바꾼다
 */
function parseNumber(raw: string, pattern: RegExp) {
  const text = raw.normalize("NFKC").trim();
  if (text === "") return null;
  if (!pattern.test(text)) return Number.NaN;
  // 백엔드 저장 칸(height_cm · weight_kg)이 소수 한 자리라 그 자리에서 반올림한다. 5-7b 계산도 이 값을 쓴다.
  // 172.55 * 10은 1725.4999…라 글자에 e1을 붙여 10배를 정확히 만든다
  return pattern === DECIMAL
    ? Math.round(Number(`${text}e1`)) / 10
    : Number(text);
}

/** 백엔드가 「올해」를 한국 시간으로 정해(`LocalDate.now(KST)`) 같은 기준으로 맞춘다 */
export function koreanYear(now: Date) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
    }).format(now),
  );
}

export function validateBody(
  input: BodyInput,
  now = new Date(),
): { ok: true; profile: BodyProfile } | { ok: false; errors: BodyErrors } {
  const errors: BodyErrors = {};
  const maxBirthYear = koreanYear(now) - MIN_AGE;

  if (!input.gender) errors.gender = "성별을 골라 주세요";

  const birthYear = parseNumber(input.birthYear, YEAR);
  if (birthYear === null) errors.birthYear = "출생 연도를 적어 주세요";
  else if (!(birthYear >= MIN_BIRTH_YEAR && birthYear <= maxBirthYear))
    errors.birthYear = `${MIN_BIRTH_YEAR}~${maxBirthYear}년 사이로 적어 주세요`;

  const heightCm = parseNumber(input.heightCm, DECIMAL);
  if (heightCm === null) errors.heightCm = "키를 적어 주세요";
  else if (!(heightCm >= HEIGHT.min && heightCm <= HEIGHT.max))
    errors.heightCm = `${HEIGHT.min}~${HEIGHT.max}cm 사이로 적어 주세요`;

  const weightKg = parseNumber(input.weightKg, DECIMAL);
  if (weightKg === null) errors.weightKg = "체중을 적어 주세요";
  else if (!(weightKg >= WEIGHT.min && weightKg <= WEIGHT.max))
    errors.weightKg = `${WEIGHT.min}~${WEIGHT.max}kg 사이로 적어 주세요`;

  if (
    Object.keys(errors).length > 0 ||
    !input.gender ||
    birthYear === null ||
    heightCm === null ||
    weightKg === null
  )
    return { ok: false, errors };
  return {
    ok: true,
    profile: {
      gender: input.gender,
      birthYear,
      heightCm,
      weightKg,
      activity: input.activity,
    },
  };
}
