import type { ScoreBand } from "@/components/common/score-ring";
import type { ScanSheetProduct } from "@/components/scan/scan-result-sheet";
import type { Goal } from "@/lib/goal/types";
import type { GradeLetter, ScannedProduct } from "@/lib/product/types";

// 등급 A–E를 점수 구간 1(잘 맞음)~5(안 맞음)로 옮긴다. 목 조회 때부터 시트가 쓰던 대응이다
const GRADE_BAND: Record<GradeLetter, ScoreBand> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
};

// GENERAL(목표 미설정)은 화면에 대응하는 목표가 없어 문구를 빼 둔다(API 플랜 12단계 「결정할 것」 1)
const GOAL_LABEL: Record<Goal, string | null> = {
  GENERAL: null,
  WEIGHT_LOSS: "다이어트 목표",
  MUSCLE_GAIN: "근육 증가 목표",
};

/** 바코드 조회 결과 → 3-2 결과 시트 모양. 등급이 있는 상품만 시트로 보인다 */
export function toSheetProduct(
  scanned: Extract<ScannedProduct, { status: "ANALYZED" }>,
): ScanSheetProduct {
  return {
    id: scanned.product.id,
    name: scanned.product.name,
    brand: scanned.product.brandName,
    imageUrl: scanned.product.imageUrl,
    score: scanned.grade.score,
    band: GRADE_BAND[scanned.grade.grade],
    // 같은 종류 안 순위는 바코드 조회 응답에 없다(인수인계 백엔드 질문 8)
    rank: null,
    goalLabel: GOAL_LABEL[scanned.appliedGoal],
    summary: scanned.topReason,
  };
}
