import { describe, expect, it } from "vitest";
import { toImpressionBody, toScanEventBody } from "@/lib/logging/mapper";

describe("logging mapper", () => {
  it("노출은 상품 ID를 숫자로 바꾸고, 검색 노출만 검색어를 보낸다", () => {
    expect(
      toImpressionBody({
        surface: "SEARCH",
        keyword: "두유",
        items: [{ productId: "7", position: 0 }],
      }),
    ).toEqual({
      surface: "SEARCH",
      keyword: "두유",
      items: [{ productId: 7, position: 0 }],
    });
    expect(
      toImpressionBody({
        surface: "LIST",
        items: [{ productId: "8", position: 1 }],
      }),
    ).toEqual({ surface: "LIST", items: [{ productId: 8, position: 1 }] });
  });

  it("스캔 이벤트는 인식된 경우에만 바코드를 보낸다", () => {
    expect(
      toScanEventBody({
        result: "NOT_IN_DATA",
        barcode: "8801062633029",
        surface: "camera",
      }),
    ).toEqual({
      result: "NOT_IN_DATA",
      barcode: "8801062633029",
      surface: "camera",
    });
    expect(toScanEventBody({ result: "PERMISSION_DENIED" })).toEqual({
      result: "PERMISSION_DENIED",
      surface: undefined,
    });
  });
});
