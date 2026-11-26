/*
 * 3-8 읽은 값 확인의 칸 · 보내기 전 검사(【최종】 ⑦ 3-8 메모, CTRB_004). 화면과 떼어 테스트한다.
 */

export type NutrientKey =
  | "energy"
  | "sodium"
  | "carbohydrate"
  | "sugars"
  | "fat"
  | "transFat"
  | "saturatedFat"
  | "cholesterol"
  | "protein"
  | "fiber";

/*
 * 포장 표 순서(메모: 10칸을 늘 다 보여 줌). required: 못 읽으면 비워 둔 채 보낼 수 없는 칸.
 * 메모는 5칸(열량 · 단백질 · 당류 · 포화지방 · 나트륨)이지만 서버는 트랜스지방 · 콜레스테롤까지 7종 중 하나라도 비면
 * 점수를 내지 않아(`ProductStatus.of`, 「영양정보 부족」) 7칸을 필수로 둔다(남은 질문 46)
 */
export const NUTRIENTS: readonly {
  key: NutrientKey;
  label: string;
  unit: "kcal" | "mg" | "g";
  required: boolean;
}[] = [
  { key: "energy", label: "열량", unit: "kcal", required: true },
  { key: "sodium", label: "나트륨", unit: "mg", required: true },
  { key: "carbohydrate", label: "탄수화물", unit: "g", required: false },
  { key: "sugars", label: "당류", unit: "g", required: true },
  { key: "fat", label: "지방", unit: "g", required: false },
  { key: "transFat", label: "트랜스지방", unit: "g", required: true },
  { key: "saturatedFat", label: "포화지방", unit: "g", required: true },
  { key: "cholesterol", label: "콜레스테롤", unit: "mg", required: true },
  { key: "protein", label: "단백질", unit: "g", required: true },
  { key: "fiber", label: "식이섬유", unit: "g", required: false },
];

/** 포장 표 기준. 칩 순서 그대로. null = 사진에서 기준을 읽지 못함 */
export type Basis = "serving" | "per100g" | "per100ml" | "total";

export const BASIS_LABEL: Record<Basis, string> = {
  serving: "1회 제공량",
  per100g: "100g당",
  per100ml: "100mL당",
  total: "총 내용량",
};

/** 1회 제공량 · 총 내용량 기준일 때만 무게 칸이 있다 */
export function hasAmount(basis: Basis | null): basis is "serving" | "total" {
  return basis === "serving" || basis === "total";
}

export type CheckValues = {
  basis: Basis | null;
  /** 1회 제공량 무게 · 총 내용량(기준에 따라 하나만 쓴다) */
  amount: Record<"serving" | "total", string>;
  nutrients: Record<NutrientKey, string>;
  /** 사진에서 읽은 값의 신뢰도가 낮아 「확인 필요」가 붙은 칸(맞아요 · 고치면 빠진다) */
  unsure: ReadonlySet<NutrientKey>;
  /** 「포장에 적힌 그대로예요」로 넘긴 값끼리 맞지 않음 */
  accepted: ReadonlySet<MismatchRule>;
};

/*
 * 읽은 값끼리 맞지 않을 때(【최종】 9723:20096 메모). 검사 세 가지: 당류 > 탄수화물, 포화지방 · 트랜스지방 > 지방,
 * 100g당 표에서 탄수화물 · 단백질 · 지방 · 나트륨의 합 > 100g. 걸린 칸은 「확인 필요」, 문장 · 버튼은 그 검사의 첫 칸 아래 한 번.
 * 칸이 비어 있으면 그 검사는 하지 않는다(비어 있는 칸은 따로 막는다)
 */
export type MismatchRule = "sugars" | "saturatedFat" | "transFat" | "sum100";

export type Mismatch = {
  rule: MismatchRule;
  /** 포장 표 순서. 첫 칸 아래에 문장 · 버튼 */
  keys: NutrientKey[];
  message: string;
};

export function mismatches(values: CheckValues): Mismatch[] {
  const n = (key: NutrientKey) =>
    isBlank(values.nutrients[key]) ? null : Number(values.nutrients[key]);
  const over = (part: NutrientKey, whole: NutrientKey) => {
    const a = n(part);
    const b = n(whole);
    return a !== null && b !== null && a > b;
  };
  const found: Mismatch[] = [];
  if (over("sugars", "carbohydrate"))
    found.push({
      rule: "sugars",
      keys: ["sugars"],
      message: "당류가 탄수화물보다 많아요.",
    });
  if (over("transFat", "fat"))
    found.push({
      rule: "transFat",
      keys: ["transFat"],
      message: "트랜스지방이 지방보다 많아요.",
    });
  if (over("saturatedFat", "fat"))
    found.push({
      rule: "saturatedFat",
      keys: ["saturatedFat"],
      message: "포화지방이 지방보다 많아요.",
    });
  if (values.basis === "per100g") {
    const parts = [n("carbohydrate"), n("protein"), n("fat"), n("sodium")];
    if (parts.every((v) => v !== null)) {
      const [carbohydrate, protein, fat, sodiumMg] = parts as number[];
      // 나트륨은 mg
      if (carbohydrate + protein + fat + sodiumMg / 1000 > 100)
        found.push({
          rule: "sum100",
          keys: ["sodium", "carbohydrate", "fat", "protein"],
          message: "탄수화물, 단백질, 지방, 나트륨을 더하면 100g이 넘어요.",
        });
    }
  }
  return found.filter((m) => !values.accepted.has(m.rule));
}

/** 칸에 적을 수 있는 모양: 숫자와 소수점 하나. 쉼표는 천 단위(「1,200kcal」)로 보고 지운다 */
export function cleanNumber(input: string) {
  const digits = input.replace(/[^\d.]/g, "");
  const dot = digits.indexOf(".");
  return dot === -1
    ? digits
    : digits.slice(0, dot + 1) + digits.slice(dot + 1).replace(/\./g, "");
}

/** 숫자가 하나도 없으면(빈 칸 · 「.」) 비어 있는 것으로 본다 */
export const isBlank = (value: string) => !/\d/.test(value);

/**
 * 「확인 필요」를 보일 칸: 신뢰도가 낮은 칸 + 비어 있는 필수 칸(메모: 「읽지 못했어요 · 눌러서 적어 주세요」) +
 * 값끼리 맞지 않는 칸
 */
export function needsCheck(
  values: CheckValues,
  key: NutrientKey,
  found: Mismatch[] = mismatches(values),
) {
  const required = NUTRIENTS.find((n) => n.key === key)?.required ?? false;
  return (
    values.unsure.has(key) ||
    (required && isBlank(values.nutrients[key])) ||
    found.some((m) => m.keys.includes(key))
  );
}

export function checkKeys(values: CheckValues) {
  const found = mismatches(values);
  return NUTRIENTS.filter((n) => needsCheck(values, n.key, found)).map(
    (n) => n.key,
  );
}

/** 보내기 전에 막는 첫 곳(화면 위에서부터). null이면 보낼 수 있다 */
export type Blocker =
  | { kind: "basis" }
  | { kind: "amount"; basis: "serving" | "total" }
  | { kind: "check"; key: NutrientKey };

export function firstBlocker(values: CheckValues): Blocker | null {
  if (!values.basis) return { kind: "basis" };
  if (hasAmount(values.basis)) {
    const amount = values.amount[values.basis];
    // 메모: 「총 내용량」 칸이 비었거나 0이면 보내지 않음. 1회 제공량 무게도 100g당으로 바꾸는 데 쓰여 같게 막는다
    if (isBlank(amount) || !(Number(amount) > 0))
      return { kind: "amount", basis: values.basis };
  }
  const key = checkKeys(values)[0];
  return key ? { kind: "check", key } : null;
}
