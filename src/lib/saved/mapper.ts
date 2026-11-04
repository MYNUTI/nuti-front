import type {
  SavedProduct,
  SavedProductDto,
  SavedProductPage,
  SavedProductPageDto,
} from "@/lib/saved/types";

export function toSavedProductPage(dto: SavedProductPageDto): SavedProductPage {
  return {
    items: dto.items.map(toSavedProduct),
    totalCount: dto.totalCount,
    hasNext: dto.hasNext,
  };
}

// 상품 결과 mapper와 같은 규칙이다. 등급이 빠져 오면 지어낼 수 없어 「분석 전」으로 보여 준다
function toSavedProduct(dto: SavedProductDto): SavedProduct {
  const base = {
    id: String(dto.productId),
    name: dto.name,
    imageUrl: dto.imageUrl,
    savedAt: dto.savedAt,
  };
  if (dto.status === "ANALYZED" && dto.grade !== null && dto.label !== null)
    return { ...base, status: "ANALYZED", grade: dto.grade, label: dto.label };
  return { ...base, status: "INSUFFICIENT" };
}
