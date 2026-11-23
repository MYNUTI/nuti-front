import { toProductCard } from "@/lib/product/mapper";
import type {
  SearchDto,
  SearchResult,
  SearchSuggestion,
  SearchSuggestionDto,
} from "@/lib/search/types";

export function toSearchResult(dto: SearchDto): SearchResult {
  return {
    query: dto.query,
    goal: dto.goal,
    sort: dto.sort,
    sortLabel: dto.sortLabel,
    total: dto.total,
    hasNext: dto.hasNext,
    pinned: dto.pinned ? toProductCard(dto.pinned) : null,
    category: dto.category ?? null,
    items: dto.items.map(toProductCard),
    didYouMean: dto.didYouMean ?? null,
    sameCategoryTop: dto.sameCategoryTop.map(toProductCard),
    canRequestAnalysis: dto.analysisRequestAvailable,
  };
}

/**
 * 무한 목록의 페이지를 하나로 합친다. 항목은 이어 붙이고, 첫 페이지에서만 오는 고정 칸(`pinned`)과 질의
 * 정보는 첫 페이지 것을, 다음 페이지 여부는 마지막 페이지 것을 쓴다
 */
export function mergeSearchPages(pages: SearchResult[]): SearchResult {
  const [first, ...rest] = pages;
  return rest.reduce(
    (merged, page) => ({
      ...merged,
      hasNext: page.hasNext,
      items: [...merged.items, ...page.items],
    }),
    first,
  );
}

export function toSearchSuggestion(dto: SearchSuggestionDto): SearchSuggestion {
  const base = { name: dto.name, matchedRanges: dto.matchedRanges };
  // PRODUCT인데 productId가 빠지면 상세로 보낼 수 없어 검색어 제안으로 쓴다
  if (dto.type === "PRODUCT" && dto.productId !== undefined)
    return {
      ...base,
      type: "PRODUCT",
      productId: String(dto.productId),
      brandName: dto.brandName ?? null,
    };
  return { ...base, type: "KEYWORD" };
}
