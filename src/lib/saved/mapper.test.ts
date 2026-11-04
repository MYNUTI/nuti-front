import { describe, expect, it } from "vitest";
import { toSavedProductPage } from "@/lib/saved/mapper";
import type { SavedProductDto } from "@/lib/saved/types";

const analyzed: SavedProductDto = {
  productId: 7,
  name: "두유",
  imageUrl: null,
  status: "ANALYZED",
  grade: "B",
  label: "잘 맞아요",
  savedAt: "2026-11-03T10:00:00",
};

describe("toSavedProductPage", () => {
  it("등급 유무를 status로 나누고 ID를 문자열로 바꾼다", () => {
    const page = toSavedProductPage({
      items: [
        analyzed,
        {
          ...analyzed,
          productId: 8,
          status: "INSUFFICIENT",
          grade: null,
          label: null,
        },
      ],
      totalCount: 12,
      hasNext: true,
    });
    expect(page).toEqual({
      items: [
        {
          id: "7",
          name: "두유",
          imageUrl: null,
          savedAt: "2026-11-03T10:00:00",
          status: "ANALYZED",
          grade: "B",
          label: "잘 맞아요",
        },
        {
          id: "8",
          name: "두유",
          imageUrl: null,
          savedAt: "2026-11-03T10:00:00",
          status: "INSUFFICIENT",
        },
      ],
      totalCount: 12,
      hasNext: true,
    });
  });

  it("ANALYZED인데 등급이 빠져 오면 분석 전으로 본다", () => {
    const page = toSavedProductPage({
      items: [{ ...analyzed, grade: null }],
      totalCount: 1,
      hasNext: false,
    });
    expect(page.items[0].status).toBe("INSUFFICIENT");
  });
});
