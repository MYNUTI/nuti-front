import "server-only";
import { cache } from "react";
import { serverApi } from "@/lib/api/server";
import { ApiError } from "@/lib/api/errors";
import type { Goal } from "@/lib/goal/types";
import { fetchAlternatives, fetchProductDetail } from "@/lib/product/api";
import type { AlternativesPage, ProductResult } from "@/lib/product/types";

// 서버 경로의 상품 ID는 Long이다. 숫자가 아니거나 Long을 넘는 id는 서버가 404가 아닌 500으로 답해,
// 보내지 않고 없는 상품으로 본다. 19자리는 Long 최댓값을 넘을 수 있어 18자리까지만 보낸다
const PRODUCT_ID = /^[1-9]\d{0,17}$/;

/**
 * 상세 페이지용 서버 조회. 없거나 비활성이면 null이라 호출자가 `notFound()`로 보낸다.
 * 서버는 조회마다 조회수를 올리고 서버의 axios 요청은 Next가 중복 제거하지 않아, React `cache()`로
 * 감싸 같은 렌더의 `generateMetadata`와 페이지가 한 번만 부르게 한다.
 */
export const getProductDetail = cache(
  async (productId: string): Promise<ProductResult | null> => {
    if (!PRODUCT_ID.test(productId)) return null;
    try {
      return await fetchProductDetail(serverApi, productId);
    } catch (error) {
      if (error instanceof ApiError && error.code === "PRODUCT_NOT_FOUND")
        return null;
      throw error;
    }
  },
);

/** 서버 기본값과 같다(`productQueries.alternatives`와 같은 크기) */
const ALTERNATIVES_PAGE_SIZE = 20;

/**
 * 3-2 · 3-4가 서버에서 그리는 더 맞는 제품 첫 페이지. 없거나 비활성이면 null이다.
 * 3-4는 지금 제품의 이름 · 점수를 응답의 `current`로 그려 상세를 다시 부르지 않는다(상세는 조회수가 오른다)
 */
export const getAlternativesFirstPage = cache(
  async (productId: string, goal: Goal): Promise<AlternativesPage | null> => {
    if (!PRODUCT_ID.test(productId)) return null;
    try {
      return await fetchAlternatives(serverApi, productId, {
        goal,
        page: 0,
        size: ALTERNATIVES_PAGE_SIZE,
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === "PRODUCT_NOT_FOUND")
        return null;
      throw error;
    }
  },
);
