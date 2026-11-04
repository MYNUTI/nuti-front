import "server-only";
import { cache } from "react";
import { serverApi } from "@/lib/api/server";
import { ApiError } from "@/lib/api/errors";
import { fetchProductDetail } from "@/lib/product/api";
import type { ProductDetail } from "@/lib/product/types";

// 서버 경로의 상품 ID는 Long이다. 숫자가 아니거나 Long을 넘는 id는 서버가 404가 아닌 500으로 답해,
// 보내지 않고 없는 상품으로 본다. 19자리는 Long 최댓값을 넘을 수 있어 18자리까지만 보낸다
const PRODUCT_ID = /^[1-9]\d{0,17}$/;

/**
 * 상세 페이지용 서버 조회. 없거나 비활성이면 null이라 호출자가 `notFound()`로 보낸다.
 * 서버는 조회마다 조회수를 올리고 서버의 axios 요청은 Next가 중복 제거하지 않아, React `cache()`로
 * 감싸 같은 렌더의 `generateMetadata`와 페이지가 한 번만 부르게 한다.
 */
export const getProductDetail = cache(
  async (productId: string): Promise<ProductDetail | null> => {
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
