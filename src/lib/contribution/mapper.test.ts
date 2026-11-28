import { describe, expect, it } from "vitest";
import {
  toAnalysisRequest,
  toAnalysisRequestBody,
  toReportCreateResult,
} from "@/lib/contribution/mapper";

describe("toAnalysisRequestBody", () => {
  it("유형에 맞는 식별값 하나만 보낸다", () => {
    expect(
      toAnalysisRequestBody({ type: "NEW_PRODUCT", barcode: "8801062633029" }),
    ).toEqual({ type: "NEW_PRODUCT", barcode: "8801062633029" });
    expect(
      toAnalysisRequestBody({ type: "NEW_PRODUCT", keyword: "두유" }),
    ).toEqual({ type: "NEW_PRODUCT", keyword: "두유" });
    expect(
      toAnalysisRequestBody({ type: "NUTRITION_FILL", productId: "7" }),
    ).toEqual({ type: "NUTRITION_FILL", productId: 7 });
    expect(
      toAnalysisRequestBody({
        type: "NEW_PRODUCT",
        productName: "고소한 두유",
        originKeyword: "두유",
      }),
    ).toEqual({
      type: "NEW_PRODUCT",
      productName: "고소한 두유",
      originKeyword: "두유",
    });
  });
});

describe("toAnalysisRequest", () => {
  it("요청 ID를 문자열로 바꾼다", () => {
    expect(
      toAnalysisRequest({
        requestId: 3,
        type: "NEW_PRODUCT",
        requestCount: 2,
        status: "ANALYZING",
        statusLabel: "분석 중",
        alreadyRequested: true,
        message: "이미 요청된 제품이에요",
      }),
    ).toEqual({
      requestId: "3",
      type: "NEW_PRODUCT",
      requestCount: 2,
      status: "ANALYZING",
      statusLabel: "분석 중",
      alreadyRequested: true,
      message: "이미 요청된 제품이에요",
    });
  });
});

describe("toReportCreateResult", () => {
  it("새로 만든 제보 ID를 문자열로 바꾸고 겹친 항목은 그대로 둔다", () => {
    expect(
      toReportCreateResult({
        reportIds: [11],
        duplicateTypes: ["NUTRITION"],
        duplicate: false,
        status: "RECEIVED",
        statusLabel: "확인 중",
        message: "보내 주셔서 고마워요",
      }),
    ).toMatchObject({ reportIds: ["11"], duplicateTypes: ["NUTRITION"] });
  });
});
