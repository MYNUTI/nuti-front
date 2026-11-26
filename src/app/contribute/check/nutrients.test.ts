import { describe, expect, it } from "vitest";

import {
  type CheckValues,
  checkKeys,
  cleanNumber,
  firstBlocker,
  type NutrientKey,
} from "./nutrients";

const full: Record<NutrientKey, string> = {
  energy: "149",
  sodium: "193",
  carbohydrate: "16.0",
  sugars: "3.4",
  fat: "5.6",
  transFat: "0",
  saturatedFat: "1.2",
  cholesterol: "5",
  protein: "10.3",
  fiber: "4.8",
};

const values = (patch: Partial<CheckValues> = {}): CheckValues => ({
  basis: "serving",
  amount: { serving: "40", total: "" },
  nutrients: full,
  unsure: new Set(),
  ...patch,
});

describe("cleanNumber", () => {
  it("숫자와 소수점 하나만 남긴다", () => {
    expect(cleanNumber("1a2.3.4mg")).toBe("12.34");
    expect(cleanNumber("")).toBe("");
    expect(cleanNumber(".5")).toBe(".5");
    // 쉼표는 천 단위로 보고 지운다(결정 기록)
    expect(cleanNumber("1,200")).toBe("1200");
    expect(cleanNumber("-3")).toBe("3");
  });
});

describe("checkKeys", () => {
  it("신뢰도가 낮은 칸과 비어 있는 필수 칸을 포장 표 순서로 모은다", () => {
    const v = values({
      unsure: new Set<NutrientKey>(["sodium"]),
      nutrients: { ...full, protein: "", fiber: "", carbohydrate: "" },
    });
    // 탄수화물 · 식이섬유는 서버 판정 7종이 아니라 비워 둘 수 있다
    expect(checkKeys(v)).toEqual(["sodium", "protein"]);
  });

  it("트랜스지방 · 콜레스테롤도 서버 판정 7종이라 비우면 확인 필요", () => {
    expect(
      checkKeys(
        values({ nutrients: { ...full, transFat: "", cholesterol: "" } }),
      ),
    ).toEqual(["transFat", "cholesterol"]);
  });

  it("숫자가 없는 칸(「.」)은 비어 있는 것으로 본다", () => {
    expect(checkKeys(values({ nutrients: { ...full, sugars: "." } }))).toEqual([
      "sugars",
    ]);
    expect(checkKeys(values({ nutrients: { ...full, sugars: "0." } }))).toEqual(
      [],
    );
    expect(checkKeys(values({ nutrients: { ...full, sugars: ".0" } }))).toEqual(
      [],
    );
  });

  it("필수 칸에 0을 적으면 값이 있는 것으로 본다", () => {
    expect(checkKeys(values({ nutrients: { ...full, sugars: "0" } }))).toEqual(
      [],
    );
  });
});

describe("firstBlocker", () => {
  it("다 맞으면 보낼 수 있다", () => {
    expect(firstBlocker(values())).toBeNull();
  });

  it("기준을 고르지 않았으면 기준부터 막는다", () => {
    expect(
      firstBlocker(
        values({ basis: null, unsure: new Set<NutrientKey>(["sodium"]) }),
      ),
    ).toEqual({ kind: "basis" });
  });

  it("1회 제공량 · 총 내용량 칸이 비었거나 0이면 막는다", () => {
    expect(
      firstBlocker(values({ amount: { serving: "", total: "" } })),
    ).toEqual({ kind: "amount", basis: "serving" });
    expect(
      firstBlocker(
        values({ basis: "total", amount: { serving: "40", total: "0" } }),
      ),
    ).toEqual({ kind: "amount", basis: "total" });
  });

  it("무게 칸이 「.」 · 「0.0」이면 막는다", () => {
    for (const serving of [".", "0.0"])
      expect(firstBlocker(values({ amount: { serving, total: "" } }))).toEqual({
        kind: "amount",
        basis: "serving",
      });
  });

  it("100g당 · 100mL당은 무게 칸을 보지 않는다", () => {
    expect(
      firstBlocker(
        values({ basis: "per100g", amount: { serving: "", total: "" } }),
      ),
    ).toBeNull();
  });

  it("확인 필요 칸이 남았으면 첫 칸에서 막는다", () => {
    expect(
      firstBlocker(
        values({ unsure: new Set<NutrientKey>(["protein", "sodium"]) }),
      ),
    ).toEqual({ kind: "check", key: "sodium" });
  });
});
