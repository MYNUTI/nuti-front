import axios from "axios";
import { describe, expect, it } from "vitest";
import { postAnalysisRequest, postProductReport } from "@/lib/contribution/api";
import { mockAdapter, success } from "@/test/http";

function client(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

const body = (data: unknown) => JSON.parse(data as string);

const accepted = {
  requestCount: 1,
  status: "ANALYZING",
  statusLabel: "분석 중",
  alreadyRequested: false,
  message: "분석을 요청했어요",
};

describe("분석 요청·오류 제보 API", () => {
  it("분석 요청은 유형에 맞춘 본문을 보낸다", async () => {
    const { http, requests } = client({
      requestId: 3,
      type: "NUTRITION_FILL",
      ...accepted,
    });
    await expect(
      postAnalysisRequest(http, { type: "NUTRITION_FILL", productId: "7" }),
    ).resolves.toMatchObject({ requestId: "3" });
    expect(requests[0]).toMatchObject({
      method: "post",
      url: "/analysis-requests",
    });
    expect(body(requests[0].data)).toEqual({
      type: "NUTRITION_FILL",
      productId: 7,
    });
  });

  it("검색어 접수는 type과 keyword만 보내고 요청 ID를 문자열로 바꾼다", async () => {
    const { http, requests } = client({
      requestId: 4,
      type: "NEW_PRODUCT",
      ...accepted,
    });
    await expect(
      postAnalysisRequest(http, { type: "NEW_PRODUCT", keyword: "두유" }),
    ).resolves.toMatchObject({ requestId: "4" });
    expect(body(requests[0].data)).toEqual({
      type: "NEW_PRODUCT",
      keyword: "두유",
    });
  });

  it("제품명 요청은 type과 제품명·어디서 왔는지를 보낸다", async () => {
    const { http, requests } = client({
      requestId: 5,
      type: "NEW_PRODUCT",
      ...accepted,
    });
    await postAnalysisRequest(http, {
      type: "NEW_PRODUCT",
      productName: "고소한 두유",
      brandName: "정식품",
      originBarcode: "8801062633029",
    });
    expect(body(requests[0].data)).toEqual({
      type: "NEW_PRODUCT",
      productName: "고소한 두유",
      brandName: "정식품",
      originBarcode: "8801062633029",
    });
  });

  it("오류 제보는 path에 인코딩한 상품 ID를 넣고 고른 항목·내용을 보낸다", async () => {
    const { http, requests } = client({
      reportIds: [11, 12],
      duplicateTypes: [],
      duplicate: false,
      status: "RECEIVED",
      statusLabel: "확인 중",
      message: "보내 주셔서 고마워요",
    });
    await expect(
      postProductReport(http, {
        productId: "7/x",
        reportTypes: ["NUTRITION", "OTHER"],
        content: "당류가 포장과 달라요",
      }),
    ).resolves.toMatchObject({ reportIds: ["11", "12"], duplicate: false });
    expect(requests[0]).toMatchObject({
      method: "post",
      url: "/products/7%2Fx/reports",
    });
    expect(body(requests[0].data)).toEqual({
      reportTypes: ["NUTRITION", "OTHER"],
      content: "당류가 포장과 달라요",
    });
  });
});
