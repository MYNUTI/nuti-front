import { describe, expect, it } from "vitest";

import { PAGE_SIZE, readResultParams } from "./result-params";

const read = (query: string) => {
  const params = new URLSearchParams(query);
  return readResultParams((name) => params.get(name));
};

describe("readResultParams", () => {
  it("값이 없거나 틀리면 기본(점수 높은 순 · 12개)", () => {
    expect(read("")).toEqual({ sort: "score", shown: PAGE_SIZE });
    expect(read("sort=popular&n=abc")).toEqual({
      sort: "score",
      shown: PAGE_SIZE,
    });
    expect(read("n=-24")).toEqual({ sort: "score", shown: PAGE_SIZE });
  });

  it("정렬과 불러온 개수(12의 배수로 올림)를 읽는다", () => {
    expect(read("sort=calories&n=24")).toEqual({ sort: "calories", shown: 24 });
    expect(read("sort=sugar&n=13")).toEqual({ sort: "sugar", shown: 24 });
  });
});
