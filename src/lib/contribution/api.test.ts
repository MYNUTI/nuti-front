import axios from "axios";
import { describe, expect, it } from "vitest";
import { postAnalysisRequest, postInquiry } from "@/lib/contribution/api";
import { mockAdapter, success } from "@/test/http";

function client(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

const body = (data: unknown) => JSON.parse(data as string);

describe("기여·문의 API", () => {
  it("분석 요청은 유형에 맞춘 본문을 보낸다", async () => {
    const { http, requests } = client({
      requestId: 3,
      type: "NUTRITION_FILL",
      requestCount: 1,
      status: "WAITING",
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
      requestCount: 1,
      status: "WAITING",
    });
    await expect(
      postAnalysisRequest(http, { type: "NEW_PRODUCT", keyword: "두유" }),
    ).resolves.toMatchObject({ requestId: "4" });
    expect(body(requests[0].data)).toEqual({
      type: "NEW_PRODUCT",
      keyword: "두유",
    });
  });

  it("문의는 받은 본문을 그대로 보낸다", async () => {
    const { http, requests } = client({ inquiryId: 9 });
    await expect(
      postInquiry(http, { content: "등급이 이상해요" }),
    ).resolves.toEqual({ inquiryId: 9 });
    expect(requests[0]).toMatchObject({
      method: "post",
      url: "/support/inquiries",
    });
    expect(body(requests[0].data)).toEqual({ content: "등급이 이상해요" });
  });
});
