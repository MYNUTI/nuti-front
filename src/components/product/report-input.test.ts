import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  needsDetail,
  reportFailMessage,
  reportSentMessage,
  toReportInput,
  type ReportReasonKey,
} from "./report-input";

const picked = (...keys: ReportReasonKey[]) => new Set(keys);

describe("toReportInput", () => {
  it("고른 항목을 화면 순서대로 제보 항목으로 바꾸고 내용은 앞뒤 공백을 지운다", () => {
    expect(
      toReportInput({
        productId: "7",
        barcode: "08801234567893",
        picked: picked("etc", "other-product", "nutrition", "name-photo"),
        detail: "  당류가 달라요 ",
      }),
    ).toEqual({
      productId: "7",
      reportTypes: ["WRONG_PRODUCT", "NAME_OR_IMAGE", "NUTRITION", "OTHER"],
      content: "당류가 달라요",
      barcode: "08801234567893",
    });
  });

  it("내용이 비었거나 바코드가 없으면 보내지 않는다", () => {
    expect(
      toReportInput({
        productId: "7",
        picked: picked("nutrition"),
        detail: "  ",
      }),
    ).toEqual({ productId: "7", reportTypes: ["NUTRITION"] });
  });

  it("고른 항목이 없으면 null", () => {
    expect(
      toReportInput({ productId: "7", picked: picked(), detail: "x" }),
    ).toBeNull();
  });
});

describe("needsDetail", () => {
  it("그 밖의 문제를 골랐는데 내용이 비었을 때만 막는다", () => {
    expect(needsDetail(picked("etc"), " ")).toBe(true);
    expect(needsDetail(picked("etc", "nutrition"), "")).toBe(true);
    expect(needsDetail(picked("etc"), "포장 사진이 달라요")).toBe(false);
    expect(needsDetail(picked("nutrition"), "")).toBe(false);
  });
});

describe("reportSentMessage", () => {
  it("전부 겹쳤을 때만 이미 보냈다고 안내한다", () => {
    expect(reportSentMessage({ duplicate: true })).toBe(
      "이미 보내 주신 내용이에요. 확인 중이에요.",
    );
    expect(reportSentMessage({ duplicate: false })).toMatch(
      /^보내 주셔서 고마워요/,
    );
  });
});

describe("reportFailMessage", () => {
  const network = /^보내지 못했어요\. 인터넷 연결을 확인하고/;

  it("서버가 거절했으면(4xx) 서버 문구를 보인다", () => {
    const limit = new ApiError({
      status: 429,
      code: "DAILY_LIMIT_EXCEEDED",
      message: "오류 제보는 하루 10건까지 접수할 수 있어요.",
    });
    expect(reportFailMessage(limit)).toBe(
      "오류 제보는 하루 10건까지 접수할 수 있어요.",
    );
  });

  it("응답이 없거나 서버 오류(5xx)면 다시 보내 보라는 디자인 문장이다", () => {
    expect(
      reportFailMessage(
        new ApiError({ status: null, code: "NETWORK_ERROR", message: "x" }),
      ),
    ).toMatch(network);
    expect(
      reportFailMessage(
        new ApiError({ status: 500, code: "UNKNOWN", message: "x" }),
      ),
    ).toMatch(network);
    expect(reportFailMessage(new Error("x"))).toMatch(network);
  });
});
