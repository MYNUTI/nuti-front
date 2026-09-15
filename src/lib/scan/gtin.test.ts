import { describe, expect, it } from "vitest";
import {
  checkGtinInput,
  gtinCheckDigit,
  isValidGtinChecksum,
  toGtin14,
} from "@/lib/scan/gtin";

/** [전체 코드, 포맷 이름] — 모두 실재하는 유효 GTIN이다. */
const VALID = [
  ["4006381333931", "EAN-13"],
  ["8801062633029", "EAN-13 (국내 880)"],
  ["96385074", "EAN-8"],
  ["012345678905", "UPC-A"],
  ["00012345678905", "GTIN-14"],
] as const;

describe("gtinCheckDigit", () => {
  it.each(VALID)("%s (%s)의 체크디짓을 복원한다", (code) => {
    expect(gtinCheckDigit(code.slice(0, -1))).toBe(Number(code.at(-1)));
  });
});

describe("isValidGtinChecksum", () => {
  it.each(VALID)("%s (%s)를 통과시킨다", (code) => {
    expect(isValidGtinChecksum(code)).toBe(true);
  });

  it("체크디짓이 틀리면 거부한다", () => {
    expect(isValidGtinChecksum("4006381333932")).toBe(false);
  });

  it("숫자가 아닌 문자가 섞이면 거부한다", () => {
    expect(isValidGtinChecksum("400638133393X")).toBe(false);
    expect(isValidGtinChecksum("4006-381333931")).toBe(false);
  });

  it("GTIN 자릿수가 아니면 거부한다", () => {
    expect(isValidGtinChecksum("400638133393")).toBe(false);
    expect(isValidGtinChecksum("")).toBe(false);
  });
});

describe("toGtin14", () => {
  it.each([
    ["8801062633029", "08801062633029"],
    ["012345678905", "00012345678905"],
    ["96385074", "00000096385074"],
    ["00012345678905", "00012345678905"],
  ])("%s → %s", (input, expected) => {
    expect(toGtin14(input)).toBe(expected);
  });

  it("숫자가 아닌 문자를 버린다", () => {
    expect(toGtin14("880-1062 633029")).toBe("08801062633029");
  });

  it("정규화해도 체크섬이 유지된다 — 선행 0은 가중합에 기여하지 않는다", () => {
    for (const [code] of VALID) {
      expect(isValidGtinChecksum(toGtin14(code))).toBe(true);
    }
  });

  it("14자리를 넘으면 조용히 자르지 않고 던진다", () => {
    expect(() => toGtin14("123456789012345")).toThrow(RangeError);
  });
});

describe("checkGtinInput", () => {
  it("빈 값만 제출 불가로 본다 — toGtin14가 0 열네 개를 만들기 때문이다", () => {
    expect(checkGtinInput("")).toBe("empty");
  });

  it.each(VALID)("%s (%s)는 valid", (code) => {
    expect(checkGtinInput(code)).toBe("valid");
  });

  it("체크디짓이 틀리면 경고 대상이다", () => {
    expect(checkGtinInput("8801062633028")).toBe("checksum-mismatch");
  });

  it("표준 자릿수가 아니면 체크섬보다 먼저 알린다", () => {
    expect(checkGtinInput("880106")).toBe("nonstandard-length");
  });
});
