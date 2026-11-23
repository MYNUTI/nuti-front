/*
 * 3-5 제품 비교 임시 데이터. 비교함(브라우저 저장소)에 담긴 id로 찾는다. API 연결 때 GET /products/compare(2~4개,
 * 요청 순서대로 · 성분표 · 1회 제공량)로 바꾼다.
 * 이름·사진·점수·영양성분은 상세 fixture(/product/[id])와 같은 값을 쓰고, 상세에 없는 탄수화물·지방만 여기 둔다
 * (상세 「4」·「5」는 디자인 3-5 그림 값, 나머지는 바탕이 된 상품 값을 따른다).
 */
import type { ScoreBand } from "@/components/common/score-ring";
import { FIXTURE_PRODUCTS } from "@/app/product/[id]/_fixtures";

/** 비교표 줄. 디자인 3-5 그림의 행 순서 */
export type CompareRowKey =
  "calories" | "protein" | "carbohydrate" | "sugar" | "fat" | "sodium";

export type CompareProduct = {
  id: string;
  brand: string | null;
  name: string;
  image: string | null;
  score: number;
  band: ScoreBand;
  /** 음료는 100mL당 */
  unit: "g" | "mL";
  /** 100g(mL)당 값. 표시가 없으면 null */
  per100: Record<CompareRowKey, number | null>;
};

const DESIGN_EXTRA = { carbohydrate: 37.5, fat: 12.3 };
const KIRKLAND_EXTRA = { carbohydrate: 36.7, fat: 10.0 };
// 상세 fixture가 어느 상품 값을 바탕으로 했는지(5·10 = 커클랜드, 나머지 = 디자인 상품)
const EXTRA: Record<string, { carbohydrate: number; fat: number }> = {
  "5": KIRKLAND_EXTRA,
  "10": KIRKLAND_EXTRA,
};

export function findCompareProduct(id: string): CompareProduct | null {
  const product = FIXTURE_PRODUCTS[id];
  if (!product) return null;
  const all = [...product.nutrition.main, ...product.nutrition.more];
  const value = (key: string) => all.find((n) => n.key === key)?.per100 ?? null;
  const extra = EXTRA[id] ?? DESIGN_EXTRA;
  return {
    id: product.id,
    brand: product.brand,
    name: product.name,
    image: product.image?.src ?? null,
    score: product.score,
    band: product.band,
    unit: product.nutrition.unit,
    per100: {
      calories: value("calories"),
      protein: value("protein"),
      carbohydrate: extra.carbohydrate,
      sugar: value("sugar"),
      fat: extra.fat,
      sodium: value("sodium"),
    },
  };
}
