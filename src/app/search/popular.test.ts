import { describe, expect, it } from "vitest";

import { popularUpdatedLabel } from "./popular";

describe("popularUpdatedLabel", () => {
  it("서버 기준 시각을 「11월 5일 16:00 업데이트」로 쓴다", () => {
    expect(popularUpdatedLabel("2026-11-05T16:00:00")).toBe(
      "11월 5일 16:00 업데이트",
    );
    expect(popularUpdatedLabel("2026-01-09T09:00:00")).toBe(
      "1월 9일 09:00 업데이트",
    );
  });

  it("아직 모으기 전(null)이거나 읽지 못하면 null", () => {
    expect(popularUpdatedLabel(null)).toBeNull();
    expect(popularUpdatedLabel("어제")).toBeNull();
  });
});
