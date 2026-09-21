import { describe, expect, it } from "vitest";
import {
  ALL_PRODUCTS,
  findProductById,
  findProductByGtin,
} from "@/lib/product";

const PROTOTYPE_KEYS = [
  "toString",
  "constructor",
  "valueOf",
  "hasOwnProperty",
  "__proto__",
];

describe("목 카탈로그 조회", () => {
  // 평범한 객체로 되돌리면 프로토타입 메서드가 truthy로 새어 /product/toString이 500이 된다.
  it.each(PROTOTYPE_KEYS)("프로토타입 키 %s는 상품이 아니다", (key) => {
    expect(findProductById(key)).toBeUndefined();
    expect(findProductByGtin(key)).toBeUndefined();
  });

  it("없는 키는 undefined다", () => {
    expect(findProductById("999")).toBeUndefined();
    expect(findProductByGtin("00000000000000")).toBeUndefined();
  });
});

describe("목 카탈로그 불변식", () => {
  // Map 생성은 중복 키를 조용히 덮어쓴다. 같은 상품이 화면마다 다른 등급으로 보이는 원인이 된다.
  it("id가 유일하다", () => {
    const ids = ALL_PRODUCTS.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gtin이 유일하다", () => {
    const gtins = ALL_PRODUCTS.map((product) => product.gtin);
    expect(new Set(gtins).size).toBe(gtins.length);
  });

  it.each(ALL_PRODUCTS)(
    "$name은 id·gtin 양쪽으로 자신이 조회된다",
    (product) => {
      expect(findProductById(product.id)).toBe(product);
      expect(findProductByGtin(product.gtin)).toBe(product);
    },
  );
});
