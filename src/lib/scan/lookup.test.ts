import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { isValidGtinChecksum, toGtin14 } from "@/lib/scan/gtin";
import { MOCK_PRODUCT_GTINS } from "@/lib/mock-catalog";
import { lookupBarcode, lookupProduct } from "@/lib/scan/lookup";
import { stubDocumentCookie, stubWebLocks } from "@/test/browser";
import { failure, mockAdapter, success, type Reply } from "@/test/http";

describe("lookupProduct (목)", () => {
  it.each(MOCK_PRODUCT_GTINS)("목 키 %s는 정규화된 유효 GTIN-14다", (gtin) => {
    expect(gtin).toHaveLength(14);
    expect(toGtin14(gtin)).toBe(gtin);
    expect(isValidGtinChecksum(gtin)).toBe(true);
  });

  it("스캔한 13자리를 정규화해 넘기면 찾는다", async () => {
    const outcome = await lookupProduct(toGtin14("8801062633029"));
    expect(outcome.status).toBe("found");
  });

  it("찾은 결과의 id는 GTIN이 아닌 내부 상품 ID다", async () => {
    const outcome = await lookupProduct(toGtin14("8801062633029"));
    if (outcome.status !== "found") throw new Error("unreachable");
    expect(outcome.result.id).not.toContain("8801062633029");
  });

  it("없는 상품은 실패가 아니라 not-found 결과다", async () => {
    await expect(lookupProduct(toGtin14("96385074"))).resolves.toEqual({
      status: "not-found",
      gtin: "00000096385074",
    });
  });
});

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
        appliedGoal: "GENERAL",
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
  ])("그 밖의 실패는 reject한다 (%#)", async (response) => {
    reply(() => response);
    await expect(lookupBarcode("08801062633029")).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
