import type { ScoreBand } from "@/components/common/score-ring";
import type { ScanSheetProduct } from "@/components/scan/scan-result-sheet";
import type { Goal } from "@/lib/goal/types";
import type {
  GoalResult,
  GradeLetter,
  ProductResult,
} from "@/lib/product/types";

// 등급 A–E를 점수 구간 1(잘 맞음)~5(안 맞음)로 옮긴다. 목 조회 때부터 시트가 쓰던 대응이다
const GRADE_BAND: Record<GradeLetter, ScoreBand> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
};

const GOAL_LABEL: Record<Goal, string> = {
  WEIGHT_LOSS: "다이어트 목표",
  MUSCLE_GAIN: "근육 증가 목표",
};

/** 바코드 조회 결과 → 3-2 결과 시트 모양. 점수가 있는 제품만 시트로 보이고, 점수는 내 목표 기준이다 */
export function toSheetProduct(
  product: ProductResult & { goals: Record<Goal, GoalResult> },
  goal: Goal,
): ScanSheetProduct {
  const result = product.goals[goal];
  return {
    id: product.id,
    name: product.name,
    brand: product.brandLine,
    imageUrl: product.imageUrl,
    score: result.score,
    band: GRADE_BAND[result.grade],
    // 같은 종류 안 순위는 결과 응답에 없다(인수인계 백엔드 질문 8)
    rank: null,
    goalLabel: GOAL_LABEL[goal],
    summary: result.summary,
  };
}
