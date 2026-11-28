import { describe, expect, it } from "vitest";

import {
  type RequestItem,
  describeRequest,
  groupRequests,
  requestHref,
} from "./requests";

const base: RequestItem = {
  id: "r",
  kind: "analysis",
  status: "ANALYZING",
  brand: null,
  name: "단백질 웨하스 초코",
  image: null,
  sentAt: "2026-10-22T03:00:00Z",
  via: "name",
  productId: null,
  query: "",
};
const now = new Date("2026-11-26T03:00:00Z");

describe("groupRequests", () => {
  it("분석 못 한 요청 → 처리 중 → 완료, 묶음 안은 최신부터, 빈 묶음은 뺀다", () => {
    const groups = groupRequests([
      { ...base, id: "a", status: "ANALYZING", sentAt: "2026-10-22T00:00:00Z" },
      { ...base, id: "b", status: "CHECKING", sentAt: "2026-10-25T00:00:00Z" },
      { ...base, id: "c", status: "FAILED" },
      { ...base, id: "d", kind: "correction", status: "REJECTED" },
    ]);
    expect(
      groups.map((g) => [g.title, g.items.map((i) => i.id).join("")]),
    ).toEqual([
      ["분석 못 한 요청", "c"],
      ["처리 중", "ba"],
      ["완료", "d"],
    ]);
  });
});

describe("describeRequest", () => {
  it("분석 요청은 보낸 방법과 날짜, 확인 중은 내 점수", () => {
    expect(describeRequest(base, now)).toBe("이름으로 요청, 10월 22일");
    expect(
      describeRequest({ ...base, status: "FAILED", via: "photo" }, now),
    ).toBe("영양성분표 사진, 10월 22일");
    expect(describeRequest({ ...base, status: "CHECKING" }, now)).toBe(
      "내가 찍은 값으로 낸 점수예요",
    );
  });

  it("정보 수정 요청은 고쳤는지 · 반영하지 않았는지", () => {
    const correction = { ...base, kind: "correction" as const };
    expect(describeRequest({ ...correction, status: "DONE" }, now)).toBe(
      "영양성분 값을 고쳤어요",
    );
    expect(describeRequest({ ...correction, status: "REJECTED" }, now)).toBe(
      "확인해 보니 지금 정보가 맞았어요.",
    );
  });

  it("그림에 없는 상태의 설명(분석 요청 완료 · 정보 수정 요청 확인 중)", () => {
    expect(describeRequest({ ...base, status: "DONE" }, now)).toBe(
      "점수가 나왔어요",
    );
    expect(
      describeRequest({ ...base, kind: "correction", status: "CHECKING" }, now),
    ).toBe("10월 22일에 보냈어요");
  });

  it("한국 날짜로 해를 본다(UTC 12-31 16시 = 한국 1월 1일)", () => {
    expect(
      describeRequest(
        { ...base, sentAt: "2025-12-31T16:00:00Z" },
        new Date("2026-01-01T03:00:00Z"),
      ),
    ).toBe("이름으로 요청, 1월 1일");
  });

  it("지난해 날짜는 연도를 붙인다", () => {
    expect(
      describeRequest({ ...base, sentAt: "2025-12-03T03:00:00Z" }, now),
    ).toBe("이름으로 요청, 2025년 12월 3일");
  });
});

describe("requestHref", () => {
  it("분석 중 · 분석 못 함은 누르는 곳이 아니다", () => {
    expect(requestHref(base)).toBeNull();
    expect(requestHref({ ...base, status: "FAILED" })).toBeNull();
  });

  it("갈 제품이 없으면 누르는 곳이 아니고, 주소 값이 없으면 3-9 주소만", () => {
    expect(requestHref({ ...base, status: "DONE" })).toBeNull();
    expect(requestHref({ ...base, status: "CHECKING" })).toBe(
      "/contribute/score",
    );
  });

  it("확인 중 분석 요청은 3-9, 정보 수정 요청 · 완료는 3-2", () => {
    expect(
      requestHref({ ...base, status: "CHECKING", query: "product=p1" }),
    ).toBe("/contribute/score?product=p1");
    expect(
      requestHref({
        ...base,
        kind: "correction",
        status: "CHECKING",
        productId: "4",
      }),
    ).toBe("/product/4");
    expect(requestHref({ ...base, status: "DONE", productId: "4" })).toBe(
      "/product/4",
    );
  });
});
