import type { CompareRowKey } from "./_fixtures";

type Goal = "diet" | "muscle";

/** 줄마다 목표에 더 맞는 쪽. 칼로리만 목표에 따라 다르고 나머지는 두 목표가 같다(5-4 점수 기준) */
export function betterDirection(
  key: CompareRowKey,
  goal: Goal,
): "lower" | "higher" {
  if (key === "calories") return goal === "diet" ? "lower" : "higher";
  return key === "protein" ? "higher" : "lower";
}

/**
 * 줄마다 굵게 보일 열(목표에 더 맞는 값, 디자인 메모 「늘 굵게」). 값이 있는 열이 둘 이상이고 모두 같지 않을 때만
 * 가장 나은 값의 열들을 돌려준다(같으면 모두). 표시 없음(null)은 비교에서 뺀다.
 * 모두 같거나 값이 하나뿐일 때 · 동점일 때의 처리는 디자인에 없어 정한 것이다(UI 플랜 「남은 질문」 22).
 * 값은 화면에 보이는 자리까지 반올림한 것을 넘긴다(roundValue) — 같은 글자인데 한쪽만 굵어지지 않게
 */
export function bestIds(
  values: readonly { id: string; value: number | null }[],
  direction: "lower" | "higher",
): ReadonlySet<string> {
  const known = values.filter(
    (v): v is { id: string; value: number } => v.value !== null,
  );
  if (known.length < 2) return new Set();
  const numbers = known.map((v) => v.value);
  const best =
    direction === "lower" ? Math.min(...numbers) : Math.max(...numbers);
  if (numbers.every((n) => n === best)) return new Set();
  return new Set(known.filter((v) => v.value === best).map((v) => v.id));
}

/** 열 순서: 점수가 가장 높은 제품이 첫 열(【최종】 메모). 점수가 같으면 담은 순서 그대로 */
export function byScore<T extends { score: number }>(
  products: readonly T[],
): T[] {
  return [...products].sort((a, b) => b.score - a.score);
}

/** 보이는 자리까지 반올림. kcal·mg는 정수, g는 소수 첫째 자리 */
export function roundValue(value: number, unit: "kcal" | "g" | "mg"): number {
  return unit === "g" ? Math.round(value * 10) / 10 : Math.round(value);
}

/** 값 글자. 소수 첫째 자리가 0이면 뗀다(UI 플랜 결정 2026-11-07, 3-2와 같은 규칙 — 【최종】은 붙임, 「【최종】 대조」) */
export function formatValue(value: number, unit: "kcal" | "g" | "mg"): string {
  return `${roundValue(value, unit)}${unit}`;
}
