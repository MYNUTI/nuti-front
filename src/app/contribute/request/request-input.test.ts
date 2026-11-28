import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { Gtin } from "@/lib/scan/types";

import { requestFailMessage, toRequestInput } from "./request-input";

describe("toRequestInput", () => {
  it("이름 · 브랜드는 앞뒤 공백을 지우고, 어디서 왔는지(바코드 · 검색어)를 함께 싣는다", () => {
    expect(
      toRequestInput({
        name: " 고소한 두유 ",
        brand: " 정식품 ",
        gtin: "08801062633029" as Gtin,
        originKeyword: null,
      }),
    ).toEqual({
      type: "NEW_PRODUCT",
      productName: "고소한 두유",
      brandName: "정식품",
      originBarcode: "08801062633029",
    });
    expect(
      toRequestInput({
        name: "단백질 웨하스",
        brand: "",
        gtin: null,
        originKeyword: "단백질 웨하스",
      }),
    ).toEqual({
      type: "NEW_PRODUCT",
      productName: "단백질 웨하스",
      originKeyword: "단백질 웨하스",
    });
  });

  it("빈 브랜드 · 어디서 왔는지가 없으면 싣지 않는다", () => {
    expect(
      toRequestInput({
        name: "두유",
        brand: "  ",
        gtin: null,
        originKeyword: null,
      }),
    ).toEqual({ type: "NEW_PRODUCT", productName: "두유" });
  });
});

describe("requestFailMessage", () => {
  it("서버가 거절했으면(4xx) 서버 문구, 응답이 없거나 5xx면 연결 문장", () => {
    expect(
      requestFailMessage(
        new ApiError({
          status: 429,
          code: "DAILY_LIMIT_EXCEEDED",
          message: "분석 요청은 하루 5건까지 보낼 수 있어요.",
        }),
      ),
    ).toBe("분석 요청은 하루 5건까지 보낼 수 있어요.");
    expect(
      requestFailMessage(
        new ApiError({
          status: 400,
          code: "BAD_REQUEST",
          message: "productName은 100자 이하여야 합니다.",
        }),
      ),
    ).toBe("productName은 100자 이하여야 합니다.");
    for (const error of [
      new ApiError({ status: null, code: "NETWORK_ERROR", message: "x" }),
      new ApiError({ status: 500, code: "UNKNOWN", message: "x" }),
      new Error("x"),
    ])
      expect(requestFailMessage(error)).toMatch(
        /^보내지 못했어요\. 인터넷 연결/,
      );
  });
});
