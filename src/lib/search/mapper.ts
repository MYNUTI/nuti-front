import type {
  SearchDto,
  SearchItem,
  SearchItemDto,
  SearchResult,
  SearchSectionDto,
  SearchSuggestion,
  SearchSuggestionDto,
} from "@/lib/search/types";

export function toSearchResult(dto: SearchDto): SearchResult {
  return {
    query: dto.query,
    appliedGoal: dto.appliedGoal,
    exactMatches: toSection(dto.exactMatches),
    similarProducts: toSection(dto.similarProducts),
    didYouMean: dto.didYouMean ?? null,
    sameCategoryTop: dto.sameCategoryTop.map(toSearchItem),
    canRequestAnalysis: dto.analysisRequest.available,
  };
}

/**
 * 무한 목록의 페이지를 하나로 합친다. 섹션 항목은 이어 붙이고, 0건일 때만 오는 폴백과 질의 정보는 첫
 * 페이지 것을 쓴다.
 */
export function mergeSearchPages(pages: SearchResult[]): SearchResult {
  const [first, ...rest] = pages;
  return rest.reduce(
    (merged, page) => ({
      ...merged,
      exactMatches: {
        total: merged.exactMatches.total,
        items: [...merged.exactMatches.items, ...page.exactMatches.items],
      },
      similarProducts: {
        total: merged.similarProducts.total,
        items: [...merged.similarProducts.items, ...page.similarProducts.items],
      },
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

function toSection(dto: SearchSectionDto) {
  return { total: dto.total, items: dto.items.map(toSearchItem) };
}

// 상품 결과 mapper와 같은 규칙이다. 등급이 빠져 오면 지어낼 수 없어 「분석 전」으로 보여 준다
function toSearchItem(dto: SearchItemDto): SearchItem {
  const base = {
    id: String(dto.productId),
    name: dto.name,
    brandName: dto.brandName,
    imageUrl: dto.imageUrl,
    saved: dto.isSaved,
  };
  if (
    dto.status === "ANALYZED" &&
    dto.grade !== undefined &&
    dto.gradeLabel !== undefined
  )
    return {
      ...base,
      status: "ANALYZED",
      grade: dto.grade,
      label: dto.gradeLabel,
      highlight: dto.highlight ?? null,
    };
  return { ...base, status: "INSUFFICIENT" };
}
