import { describe, expect, it } from "vitest";
import { toScanEventBody } from "@/lib/logging/mapper";

describe("logging mapper", () => {
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
