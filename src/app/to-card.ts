import type { ProductCardInput } from "@/components/common/product-card";
import type { ScoreBand } from "@/components/common/score-ring";
import type { Goal } from "@/lib/goal/types";
import type { GradeLetter, ProductCardData } from "@/lib/product/types";

/*
 * 상품 API 결과 → 화면 부품 값. 3-2 · 3-4 · 2-4(검색 결과)가 함께 쓴다.
 */

/** 점수 구간은 서버 등급을 그대로 옮긴다(A 매우 높음 … E 매우 낮음). 화면이 점수로 다시 나누면 서버 판정과 어긋날 수 있다 */
export const GRADE_BAND: Record<GradeLetter, ScoreBand> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
};

/** API가 사진 크기를 주지 않는다. 사진 칸이 정사각이라 원본 크기는 비율만 맞으면 된다 */
export const PHOTO_SIZE = 400;

/** 서버 점수는 소수 한 자리(72.4)다. 점수 링(`ScoreRing`)이 반올림해 보여 글자(「72점」)도 같은 정수로 맞춘다 */
export function toScore(score: number) {
  return Math.round(score);
}

/**
 * 목록 카드 한 장. 점수가 없는 제품은 점수 · 구간이 null이라 회색 「점수 없음」이다.
 * 영양소 정렬이면 서버가 태그 자리에 그 값 글(「단백질 21g · 100g당」)을 준다.
 * 카드 태그에 걸리는 성분 표시(분홍)는 API에 없어 모두 같은 색이다
 */
export function toCardInput(
  card: ProductCardData,
  goal: Goal,
): ProductCardInput {
  const result = card.goals?.[goal] ?? null;
  return {
    id: card.id,
    brand: card.brandLine ?? "",
    name: card.name,
    image: card.imageUrl,
    imageSize: PHOTO_SIZE,
    score: result && toScore(result.score),
    band: result && GRADE_BAND[result.grade],
    tags: card.sortValue
      ? [{ label: card.sortValue.text }]
      : card.tags.map((label) => ({ label })),
  };
}
