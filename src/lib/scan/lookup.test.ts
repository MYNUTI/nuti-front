import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { lookupBarcode } from "@/lib/scan/lookup";
import { stubDocumentCookie, stubWebLocks } from "@/test/browser";
import { failure, mockAdapter, success, type Reply } from "@/test/http";
import { productResultDto } from "@/test/product";

describe("lookupBarcode (API)", () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    stubDocumentCookie();
    stubWebLocks();
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  function reply(handler: () => Reply) {
    const mock = mockAdapter(handler);
    api.defaults.adapter = mock.adapter;
    return mock;
  }

  it("결과 분기를 그대로 돌려준다", async () => {
    const { requests } = reply(() =>
      success({
        outcome: "NO_SCORE",
        barcode: "8801062633029",
        result: productResultDto({ state: "NO_SCORE", goals: [] }),
        candidates: null,
      }),
    );
    await expect(lookupBarcode("08801062633029")).resolves.toMatchObject({
      outcome: "NO_SCORE",
      product: { id: "7", goals: null },
    });
    expect(requests[0].url).toBe("/products/barcode/08801062633029");
  });

  it("미등록은 200 NOT_FOUND 결과다", async () => {
    reply(() =>
      success({
        outcome: "NOT_FOUND",
        barcode: "8801062633029",
        result: null,
        candidates: null,
      }),
    );
    await expect(lookupBarcode("08801062633029")).resolves.toEqual({
      outcome: "NOT_FOUND",
      barcode: "8801062633029",
    });
  });

  it("체크섬 오류(400)는 CHECKSUM_INVALID 결과다", async () => {
    reply(() => failure(400, "BARCODE_CHECKSUM_INVALID"));
    await expect(lookupBarcode("08801062633028")).resolves.toEqual({
      outcome: "CHECKSUM_INVALID",
      gtin: "08801062633028",
    });
  });

  it.each([
    failure(500, "INTERNAL_SERVER_ERROR"),
    failure(400, "VALIDATION_FAILED"),
    // 앞자리가 0이 아닌 14자리. 화면은 조회 실패로 보인다
    failure(400, "BAD_REQUEST"),
  ])("그 밖의 실패는 reject한다 (%#)", async (response) => {
    reply(() => response);
    await expect(lookupBarcode("08801062633029")).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
