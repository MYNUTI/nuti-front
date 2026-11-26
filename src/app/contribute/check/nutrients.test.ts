import { describe, expect, it } from "vitest";

import {
  type CheckValues,
  checkKeys,
  cleanNumber,
  firstBlocker,
  mismatches,
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
  accepted: new Set(),
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

describe("mismatches", () => {
  it("당류가 탄수화물보다 크면 당류 칸에 걸린다", () => {
    const v = values({ nutrients: { ...full, sugars: "18.0" } });
    expect(mismatches(v).map((m) => [m.rule, m.keys])).toEqual([
      ["sugars", ["sugars"]],
    ]);
    expect(checkKeys(v)).toEqual(["sugars"]);
    expect(firstBlocker(v)).toEqual({ kind: "check", key: "sugars" });
  });

  it("포화지방 · 트랜스지방이 지방보다 크면 각 칸에 걸린다", () => {
    const v = values({
      nutrients: { ...full, fat: "1.0", saturatedFat: "1.2", transFat: "2" },
    });
    expect(mismatches(v).map((m) => m.rule)).toEqual([
      "transFat",
      "saturatedFat",
    ]);
  });

  it("100g당 표에서만 네 성분 합(나트륨은 mg)이 100g을 넘는지 본다", () => {
    const nutrients = {
      ...full,
      carbohydrate: "60",
      protein: "30",
      fat: "9.9",
      sodium: "200",
    };
    // 60 + 30 + 9.9 + 0.2 = 100.1
    expect(
      mismatches(values({ basis: "per100g", nutrients })).map((m) => m.keys),
    ).toEqual([["sodium", "carbohydrate", "fat", "protein"]]);
    expect(mismatches(values({ basis: "serving", nutrients }))).toEqual([]);
  });

  it("같거나 합이 정확히 100g이면 걸리지 않는다", () => {
    expect(
      mismatches(
        values({ nutrients: { ...full, sugars: "16", carbohydrate: "16" } }),
      ),
    ).toEqual([]);
    const nutrients = {
      ...full,
      carbohydrate: "60",
      protein: "30",
      fat: "10",
      sodium: "0",
    };
    expect(mismatches(values({ basis: "per100g", nutrients }))).toEqual([]);
  });

  it("칸이 비었으면 그 검사는 하지 않는다", () => {
    expect(
      mismatches(
        values({ nutrients: { ...full, sugars: "18", carbohydrate: "" } }),
      ),
    ).toEqual([]);
  });

  it("포장에 적힌 그대로예요로 넘긴 검사는 빠진다", () => {
    const v = values({
      nutrients: { ...full, sugars: "18.0" },
      accepted: new Set(["sugars" as const]),
    });
    expect(mismatches(v)).toEqual([]);
    expect(firstBlocker(v)).toBeNull();
  });
});
