import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { getProductDetail } from "@/lib/product/server";
import { failure, mockAdapter, success, type Reply } from "@/test/http";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const originalAdapter = serverApi.defaults.adapter;

function useAdapter(handler: () => Reply) {
  const mock = mockAdapter(handler);
  serverApi.defaults.adapter = mock.adapter;
  return mock;
}

describe("getProductDetail", () => {
  afterEach(() => {
    serverApi.defaults.adapter = originalAdapter;
  });

  it.each([
    "abc",
    "0",
    "-1",
    "1.5",
    "",
    "7/../x",
    "9999999999999999999",
    "12345678901234567890",
  ])(
    "숫자 ID가 아니거나 Long을 넘을 수 있는 %s는 서버에 보내지 않고 null이다",
    async (id) => {
      const { requests } = useAdapter(() => success());
      await expect(getProductDetail(id)).resolves.toBeNull();
      expect(requests).toHaveLength(0);
    },
  );

  it("18자리 ID는 보낸다", async () => {
    const { requests } = useAdapter(() => failure(404, "PRODUCT_NOT_FOUND"));
    await getProductDetail("999999999999999999");
    expect(requests[0].url).toBe("/products/999999999999999999");
  });

  it("없거나 비활성인 상품(404)은 null이다", async () => {
    useAdapter(() => failure(404, "PRODUCT_NOT_FOUND"));
    await expect(getProductDetail("7")).resolves.toBeNull();
  });

  it("그 밖의 실패는 그대로 reject한다", async () => {
    useAdapter(() => failure(500, "INTERNAL_SERVER_ERROR"));
    await expect(getProductDetail("7")).rejects.toBeInstanceOf(ApiError);
  });

  it("찾으면 화면 모델로 돌려준다", async () => {
    useAdapter(() =>
      success({
        status: "INSUFFICIENT",
        product: {
          productId: 7,
          name: "두유",
          brandName: null,
          imageUrl: null,
          servingSize: null,
        },
        appliedGoal: "GENERAL",
        saved: true,
      }),
    );
    await expect(getProductDetail("7")).resolves.toMatchObject({
      status: "INSUFFICIENT",
      product: { id: "7" },
      saved: true,
    });
  });
});
