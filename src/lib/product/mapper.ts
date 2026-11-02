import type {
  BarcodeScanDto,
  GradeReason,
  GradeReasonDto,
  Grading,
  ProductDetail,
  ProductDetailDto,
  ProductSummary,
  ProductSummaryDto,
  ScannedProduct,
} from "@/lib/product/types";

export function toScannedProduct(dto: BarcodeScanDto): ScannedProduct {
  return {
    ...toGrading(dto),
    product: toProductSummary(dto.product),
    appliedGoal: dto.appliedGoal,
  };
}

export function toProductDetail(dto: ProductDetailDto): ProductDetail {
  return {
    ...toScannedProduct(dto),
    nutrition: dto.nutrition ?? null,
    saved: dto.saved,
  };
}

export function toGradeReason(dto: GradeReasonDto): GradeReason {
  return {
    appliedGoal: dto.appliedGoal,
    factors: dto.factors,
    fiberNotice: dto.fiberNotice ?? null,
    methodology: dto.methodology,
  };
}

function toProductSummary(dto: ProductSummaryDto): ProductSummary {
  return {
    id: String(dto.productId),
    name: dto.name,
    brandName: dto.brandName,
    imageUrl: dto.imageUrl,
    servingSize: dto.servingSize,
    sourceNote: dto.sourceNote ?? null,
  };
}

// 서버는 ANALYZED면 등급을 항상 채운다(사전계산이 없으면 즉석 계산). 그래도 등급이 빠져 오면
// 등급을 지어낼 수 없으니 「분석 전」으로 보여 준다
function toGrading(dto: BarcodeScanDto): Grading {
  if (dto.status === "ANALYZED" && dto.grade) {
    return {
      status: "ANALYZED",
      grade: dto.grade,
      topReason: dto.topReason ?? null,
    };
  }
  return { status: "INSUFFICIENT" };
}
