import { describe, expect, it } from "vitest";

import { fitLongEdge } from "./photo-size";

describe("영양성분표 사진 크기", () => {
  it("긴 변이 2,400px를 넘으면 비율을 지켜 줄이고, 넘지 않으면 그대로", () => {
    expect(fitLongEdge(4032, 3024)).toEqual({ width: 2400, height: 1800 });
    expect(fitLongEdge(3000, 4000)).toEqual({ width: 1800, height: 2400 });
    expect(fitLongEdge(1920, 1080)).toEqual({ width: 1920, height: 1080 });
    expect(fitLongEdge(2400, 100)).toEqual({ width: 2400, height: 100 });
  });
});
