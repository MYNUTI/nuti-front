import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("글자 스타일과 글자 색을 함께 남긴다", () => {
    expect(cn("text-body1", "text-brand-link")).toBe(
      "text-body1 text-brand-link",
    );
  });

  it("글자 스타일끼리는 뒤의 것만 남긴다", () => {
    expect(cn("text-body1", "text-body2-bold")).toBe("text-body2-bold");
  });

  it("rounded-sheet와 다른 모서리는 뒤의 것만 남긴다", () => {
    expect(cn("rounded-md", "rounded-sheet")).toBe("rounded-sheet");
  });
});
