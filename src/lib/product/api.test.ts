import axios from "axios";
import { describe, expect, it } from "vitest";
import { fetchProductByBarcode, fetchProductDetail } from "@/lib/product/api";
import { mockAdapter, success } from "@/test/http";
import { productResultDto } from "@/test/product";

function http(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

describe("상품 API", () => {
  it("바코드 조회는 경로에 바코드를 넣고 화면 모델로 바꾼다", async () => {
    const { http: client, requests } = http({
      outcome: "RESULT",
      barcode: "8801062633029",
      result: productResultDto(),
      candidates: null,
    });

    await expect(
      fetchProductByBarcode(client, "08801062633029"),
    ).resolves.toMatchObject({ outcome: "RESULT", product: { id: "7" } });
    expect(requests[0].url).toBe("/products/barcode/08801062633029");
  });

  it("상세 조회는 path 값을 인코딩하고 source를 줄 때만 query로 보낸다", async () => {
    const { http: client, requests } = http(productResultDto());

    await expect(fetchProductDetail(client, "7/../x")).resolves.toMatchObject({
      id: "7",
    });
    await fetchProductDetail(client, "7", { source: "SEARCH" });
    expect(requests[0].url).toBe("/products/7%2F..%2Fx");
    expect(client.getUri(requests[0])).toBe("/products/7%2F..%2Fx");
    expect(client.getUri(requests[1])).toBe("/products/7?source=SEARCH");
  });
});
