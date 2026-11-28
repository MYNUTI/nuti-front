import { toGtin14 } from "@/lib/scan/gtin";
import type { Gtin } from "@/lib/scan/types";

/** 3-7 → 3-7x · 3-8로 이어 넘기는 값(3-6 제품 요청하기의 이름 · 브랜드, 3-6의 바코드 · 제품 번호) */
const PASS_THROUGH = ["name", "brand", "gtin", "product"] as const;

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * 받은 주소 값에서 넘길 값만 골라낸다. 바코드는 3-6 제품 요청하기와 같게 숫자 8~14자리만 받아 GTIN-14로 맞춘다.
 * query: 다음 화면 · 3-7로 돌아갈 때 붙일 값, labelHref: 3-7 주소
 */
export function passThrough(searchParams: SearchParams) {
  const params = new URLSearchParams();
  let gtin: Gtin | null = null;
  for (const key of PASS_THROUGH) {
    const raw = searchParams[key];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) continue;
    if (key === "gtin") {
      if (!/^\d{8,14}$/.test(value)) continue;
      gtin = toGtin14(value);
      params.set(key, gtin);
    } else params.set(key, value);
  }
  const query = params.toString();
  return {
    query,
    gtin,
    labelHref: `/contribute/label${query ? `?${query}` : ""}`,
  };
}
