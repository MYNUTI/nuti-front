import { describe, expect, it } from "vitest";
import {
  toAnalysisRequest,
  toAnalysisRequestBody,
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
  });
});

describe("toAnalysisRequest", () => {
  it("요청 ID를 문자열로 바꾼다", () => {
    expect(
      toAnalysisRequest({
        requestId: 3,
        type: "NEW_PRODUCT",
        requestCount: 2,
        status: "WAITING",
      }),
    ).toEqual({
      requestId: "3",
      type: "NEW_PRODUCT",
      requestCount: 2,
      status: "WAITING",
    });
  });
});
