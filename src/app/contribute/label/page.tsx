import type { Metadata } from "next";

import { toGtin14 } from "@/lib/scan/gtin";

import { LabelCamera } from "./label-camera";

export const metadata: Metadata = { title: "영양성분표 찍기" };

// 3-8로 이어 넘기는 값(3-6 제품 요청하기의 이름 · 브랜드, 3-6의 바코드 · 제품 번호)
const PASS_THROUGH = ["name", "brand", "gtin", "product"] as const;

/*
 * 3-7 영양성분표 찍기. 오는 곳: 3-6 「영양성분표 찍고 점수 보기」(`?gtin=` · `?product=`), 3-6 제품 요청하기
 * 「사진 추가」(`?name=` · `?brand=` · `?gtin=`), 3-1 바코드를 못 읽었을 때, 2-4b. 받은 값은 3-8로 이어 넘긴다
 */
export default async function LabelPage({
  searchParams,
}: PageProps<"/contribute/label">) {
  const query = await searchParams;
  const next = new URLSearchParams();
  for (const key of PASS_THROUGH) {
    const value = query[key];
    if (typeof value !== "string" || !value) continue;
    // 바코드는 제품 요청하기와 같게 숫자 8~14자리만 받아 GTIN-14로 맞춘다
    if (key === "gtin") {
      if (/^\d{8,14}$/.test(value)) next.set(key, toGtin14(value));
    } else next.set(key, value);
  }
  return <LabelCamera nextQuery={next.toString()} />;
}
