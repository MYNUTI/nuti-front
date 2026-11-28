import { API_GOAL, SCREEN_GOAL } from "@/app/my/goals";
import { GRADE_BAND, PHOTO_SIZE, toCardInput, toScore } from "@/app/to-card";
import type {
  Alternative,
  GoalResult,
  NutrientCode,
  NutrientRow,
  ProductResult as ApiProductResult,
} from "@/lib/product/types";

import type {
  BetterItem,
  Goal,
  GoalView,
  NutrientValue,
  ProductResult,
} from "./model";

export { API_GOAL, GRADE_BAND, SCREEN_GOAL, toScore };

/**
 * 몸 정보를 쓰지 않으면 서버는 하루 2,000kcal로 감량 점수를 매긴다. 응답에 「내 몸에 맞춤」 여부가 따로 없어
 * 이 값과 다를 때만 맞춘 것으로 본다. 몸 정보로 계산한 값이 마침 2,000이면 표시되지 않는다(API 플랜 「남은 질문」)
 */
const DEFAULT_KCAL_BAND = 2000;

/** 디자인이 처음부터 보이는 줄. 나머지는 서버 순서대로 「영양성분 자세히 보기」에 넣는다 */
const MAIN_NUTRIENTS: readonly NutrientCode[] = [
  "CALORIES",
  "PROTEIN",
  "SUGAR",
];

const OTHER_GOAL: Record<Goal, Goal> = { diet: "muscle", muscle: "diet" };

export function toGoalView(result: GoalResult): GoalView {
  return {
    score: toScore(result.score),
    band: GRADE_BAND[result.grade],
    rank: null,
    reasons: {
      good: result.goods.map((p) => p.text),
      bad: result.bads.map((p) => p.text),
    },
  };
}

function toNutrient(row: NutrientRow): NutrientValue {
  const amount = (a: NonNullable<NutrientRow["perServing"]>) => ({
    value: a.value,
    dvPercent: a.dvPercent,
    levelLabel: a.levelLabel,
  });
  return {
    key: row.nutrient,
    label: row.label,
    unit: row.unit,
    per100: amount(row.per100g),
    perServing: row.perServing && amount(row.perServing),
  };
}

function toPurchase(
  purchase: ApiProductResult["purchase"],
): Pick<ProductResult, "coupangUrl" | "coupangSoldOut" | "coupangPrice"> {
  if (purchase.matchType === "NONE" || purchase.url === null)
    return { coupangUrl: null, coupangSoldOut: false, coupangPrice: null };
  // 이름으로 찾은 검색 결과뿐이면 「구매하기」를 쓰지 않는다(명세). 그린 화면이 없어 품절 모양(가격 없이 「쿠팡에서
  // 찾아보기」)을 빌린다(API 플랜 「남은 질문」)
  if (purchase.matchType === "NAME_SEARCH")
    return {
      coupangUrl: purchase.url,
      coupangSoldOut: true,
      coupangPrice: null,
    };
  return {
    coupangUrl: purchase.url,
    coupangSoldOut: false,
    coupangPrice:
      purchase.price !== null && purchase.priceCheckedAt !== null
        ? {
            kind: "single",
            amount: purchase.price,
            date: purchase.priceCheckedAt.slice(0, 10),
          }
        : null,
  };
}

/** 점수가 없는 더 맞는 제품은 서버가 주지 않지만, 타입상 올 수 있어 뺀다 */
export function toBetterItems(
  alternatives: readonly Alternative[],
  goal: Goal,
): BetterItem[] {
  return alternatives.flatMap(({ product, diffs }) => {
    const { score, band, ...card } = toCardInput(product, API_GOAL[goal]);
    if (score === null || band === null) return [];
    return [
      {
        ...card,
        score,
        band,
        diff: diffs
          .slice(0, 2)
          .map((d) => d.text)
          .join(", "),
      },
    ];
  });
}

/**
 * 화면은 「1개(40g)는 165kcal」처럼 이름과 양을 따로 쓴다. 성분표 글자(「1개(40g)」)에서 양을 떼어 이름만 남기고,
 * 양만 적혀 있으면(「40g」) 「1회 제공량」. 양을 못 읽은 제품은 1회 제공량으로 바꿔 볼 수 없어 null
 */
export function toServing(
  serving: ApiProductResult["serving"],
): ProductResult["nutrition"]["serving"] {
  if (!serving || serving.amount === null) return null;
  const label = serving.text
    .replace(/\(?\s*\d[\d.,]*\s*(kg|g|ml|l)\s*\)?/i, "")
    .trim();
  return { label: label || "1회 제공량", amount: serving.amount };
}

/** 점수가 없는 제품(`goals`가 null)은 3-2로 그릴 수 없어 null. 호출자가 3-6으로 보낸다 */
export function toScreenProduct(
  product: ApiProductResult,
  goal: Goal,
  alternatives: readonly Alternative[],
): ProductResult | null {
  if (!product.goals) return null;
  const mine = toGoalView(product.goals[API_GOAL[goal]]);
  const other = OTHER_GOAL[goal];
  const nutrients = product.nutrients.map(toNutrient);

  return {
    id: product.id,
    brand: product.brandLine,
    category: product.category?.name ?? "",
    categoryCode: product.category?.code ?? null,
    name: product.name,
    image: product.imageUrl
      ? { src: product.imageUrl, size: PHOTO_SIZE }
      : null,
    ...mine,
    goal,
    bodyFitKcal:
      product.kcalBand === DEFAULT_KCAL_BAND ? null : product.kcalBand,
    patientFood: product.patientFoodNote !== null,
    preview: { [other]: toGoalView(product.goals[API_GOAL[other]]) },
    nutrition: {
      unit: product.basis === "100mL" ? "mL" : "g",
      serving: toServing(product.serving),
      main: MAIN_NUTRIENTS.flatMap(
        (code) => nutrients.find((n) => n.key === code) ?? [],
      ),
      more: nutrients.filter((n) => !MAIN_NUTRIENTS.includes(n.key)),
    },
    better: toBetterItems(alternatives, goal),
    production:
      product.state === "ANALYZED" || product.state === "NO_SCORE"
        ? null
        : { label: product.stateLabel },
    ...toPurchase(product.purchase),
    saved: product.saved,
  };
}
