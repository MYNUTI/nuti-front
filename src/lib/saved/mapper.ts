import { toProductCard } from "@/lib/product/mapper";
import type { SavedProductPage, SavedProductPageDto } from "@/lib/saved/types";

export function toSavedProductPage(dto: SavedProductPageDto): SavedProductPage {
  return {
    items: dto.items.map(({ product, savedAt }) => ({
      product: toProductCard(product),
      savedAt,
    })),
    totalCount: dto.totalCount,
    hasNext: dto.hasNext,
  };
}
