import { describe, expect, it } from "vitest";
import { toSavedProductPage } from "@/lib/saved/mapper";
import { productCardDto } from "@/test/product";

describe("toSavedProductPage", () => {
  it("항목을 목록 카드로 바꾸고 저장 시각을 둔다", () => {
    expect(
      toSavedProductPage({
        goal: "WEIGHT_LOSS",
        kcalBand: 2000,
        totalCount: 2,
        hasNext: true,
        items: [
          {
            product: productCardDto({
              saved: true,
              better: { status: "AVAILABLE", count: 3 },
            }),
            savedAt: "2026-11-20T10:00:00",
          },
          {
            product: productCardDto({
              productId: 8,
              state: "DISCONTINUED",
              stateLabel: "단종",
              goals: [],
              saved: true,
            }),
            savedAt: "2026-11-19T10:00:00",
          },
        ],
      }),
    ).toMatchObject({
      totalCount: 2,
      hasNext: true,
      items: [
        {
          product: { id: "7", better: { status: "AVAILABLE", count: 3 } },
          savedAt: "2026-11-20T10:00:00",
        },
        { product: { id: "8", state: "DISCONTINUED", goals: null } },
      ],
    });
  });
});
