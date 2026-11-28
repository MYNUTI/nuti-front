import { describe, expect, it } from "vitest";

import {
  isSearchable,
  MAX_RESTORE_PAGES,
  PAGE_SIZE,
  readResultParams,
} from "./result-params";

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

  it("되살리는 개수는 상한(페이지 수)을 넘지 않는다", () => {
    expect(read("n=100000").shown).toBe(MAX_RESTORE_PAGES * PAGE_SIZE);
  });
});

describe("isSearchable", () => {
  it("글자나 숫자가 하나라도 있어야 서버에 보낸다", () => {
    expect(isSearchable("두유")).toBe(true);
    expect(isSearchable("~2%")).toBe(true);
    expect(isSearchable("protein!")).toBe(true);
    expect(isSearchable("!!!")).toBe(false);
    expect(isSearchable("~ ~")).toBe(false);
  });
});
