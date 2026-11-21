import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { lookupBarcode } from "@/lib/scan/lookup";
import { stubDocumentCookie, stubWebLocks } from "@/test/browser";
import { failure, mockAdapter, success, type Reply } from "@/test/http";

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

  it("찾으면 화면 모델로 돌려준다", async () => {
    const { requests } = reply(() =>
      success({
        status: "INSUFFICIENT",
        product: {
          productId: 7,
          name: "두유",
          brandName: null,
          imageUrl: null,
          servingSize: null,
        },
        appliedGoal: "WEIGHT_LOSS",
      }),
    );
    await expect(lookupBarcode("08801062633029")).resolves.toMatchObject({
      status: "found",
      product: { status: "INSUFFICIENT", product: { id: "7" } },
    });
    expect(requests[0].url).toBe("/products/barcode/08801062633029");
  });

  it("미등록(404)은 실패가 아니라 not-found 결과다", async () => {
    reply(() => failure(404, "PRODUCT_NOT_FOUND"));
    await expect(lookupBarcode("08801062633029")).resolves.toEqual({
      status: "not-found",
      gtin: "08801062633029",
    });
  });

  it("체크섬 오류(400)는 checksum-invalid 결과다", async () => {
    reply(() => failure(400, "BARCODE_CHECKSUM_INVALID"));
    await expect(lookupBarcode("08801062633028")).resolves.toEqual({
      status: "checksum-invalid",
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
