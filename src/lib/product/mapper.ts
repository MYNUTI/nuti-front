import type { Goal } from "@/lib/goal/types";
import type {
  BarcodeScan,
  GoalResult,
  GoalResultDto,
  ProductCandidate,
  ProductCandidateDto,
  ProductResult,
  ProductResultDto,
  PurchaseLink,
  PurchaseLinkDto,
  ScanResultDto,
} from "@/lib/product/types";

export function toProductResult(dto: ProductResultDto): ProductResult {
  return {
    id: String(dto.productId),
    name: dto.name,
    brandLine: dto.brandLine,
    imageUrl: dto.imageUrl,
    state: dto.state,
    stateLabel: dto.stateLabel,
    category: dto.category,
    patientFoodNote: dto.patientFoodNote,
    serving: dto.serving,
    basis: dto.basis,
    kcalBand: dto.kcalBand,
    goals: toGoals(dto.goals),
    nutrients: dto.nutrients,
    purchase: toPurchaseLink(dto.purchase),
    saved: dto.saved,
    sourceNote: dto.sourceNote,
  };
}

export function toBarcodeScan(dto: ScanResultDto): BarcodeScan {
  switch (dto.outcome) {
    case "RESULT":
    case "NO_SCORE":
      return {
        outcome: dto.outcome,
        barcode: dto.barcode,
        product: toProductResult(dto.result),
      };
    case "MULTIPLE":
      return {
        outcome: "MULTIPLE",
        barcode: dto.barcode,
        candidates: dto.candidates.map(toCandidate),
      };
    case "NOT_FOUND":
      return { outcome: "NOT_FOUND", barcode: dto.barcode };
  }
}

// 서버는 두 목표를 함께 주거나(점수 있음) 빈 배열을 준다. 한 목표만 오면 다른 목표의 점수를 지어낼 수
// 없으니 점수 없음으로 본다
function toGoals(dtos: GoalResultDto[]): Record<Goal, GoalResult> | null {
  const weightLoss = dtos.find((g) => g.goal === "WEIGHT_LOSS");
  const muscleGain = dtos.find((g) => g.goal === "MUSCLE_GAIN");
  if (!weightLoss || !muscleGain) return null;
  return { WEIGHT_LOSS: weightLoss, MUSCLE_GAIN: muscleGain };
}

function toPurchaseLink(dto: PurchaseLinkDto): PurchaseLink {
  return {
    matchType: dto.matchType,
    url: dto.url ?? null,
    price: dto.price ?? null,
    priceCheckedAt: dto.priceCheckedAt ?? null,
    priceStale: dto.priceStale ?? false,
    isAd: dto.isAd,
    adNotice: dto.adNotice ?? null,
  };
}

function toCandidate({
  productId,
  ...rest
}: ProductCandidateDto): ProductCandidate {
  return { id: String(productId), ...rest };
}
