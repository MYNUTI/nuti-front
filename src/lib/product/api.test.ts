import axios from "axios";
import { describe, expect, it } from "vitest";
import {
  fetchGradeReason,
  fetchProductByBarcode,
  fetchProductDetail,
} from "@/lib/product/api";
import { mockAdapter, success } from "@/test/http";

const product = {
  productId: 7,
  name: "두유",
  brandName: null,
  imageUrl: null,
  servingSize: "190ml",
};

function http(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

describe("상품 API", () => {
  it("바코드 조회는 경로에 바코드를 넣고 화면 모델로 바꾼다", async () => {
    const { http: client, requests } = http({
      status: "INSUFFICIENT",
      product,
      appliedGoal: "GENERAL",
    });

    await expect(
      fetchProductByBarcode(client, "08801062633029"),
    ).resolves.toMatchObject({ status: "INSUFFICIENT", product: { id: "7" } });
    expect(requests[0].url).toBe("/products/barcode/08801062633029");
  });

  it("상세 조회는 path 값을 인코딩한다", async () => {
    const { http: client, requests } = http({
      status: "INSUFFICIENT",
      product,
      appliedGoal: "GENERAL",
      saved: false,
    });

    await expect(fetchProductDetail(client, "7/../x")).resolves.toMatchObject({
      nutrition: null,
      saved: false,
    });
    expect(requests[0].url).toBe("/products/7%2F..%2Fx");
  });

  it("등급 근거는 goal을 줄 때만 query로 보낸다", async () => {
    const reason = {
      appliedGoal: "WEIGHT_LOSS",
      factors: [],
      methodology: { steps: [], note: null },
    };
    const { http: client, requests } = http(reason);

    await expect(fetchGradeReason(client, "7")).resolves.toMatchObject({
      fiberNotice: null,
    });
    await fetchGradeReason(client, "7", "MUSCLE_GAIN");
    expect(requests[0].url).toBe("/products/7/grade-reason");
    expect(client.getUri(requests[0])).toBe("/products/7/grade-reason");
    expect(client.getUri(requests[1])).toBe(
      "/products/7/grade-reason?goal=MUSCLE_GAIN",
    );
  });
});
