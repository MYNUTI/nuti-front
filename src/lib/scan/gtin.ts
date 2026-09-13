import type { Gtin } from "@/lib/scan/types";

const GTIN_LENGTHS = [8, 12, 13, 14];

/**
 * 우측부터 3, 1을 번갈아 곱해 합산한 뒤 10의 배수를 만드는 값.
 * EAN-8 / UPC-A / EAN-13 / GTIN-14가 모두 같은 규칙을 쓴다.
 *
 * @param body 체크디짓을 뺀 앞자리
 */
export function gtinCheckDigit(body: string): number {
  let sum = 0;
  let weight = 3;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidGtinChecksum(code: string): boolean {
  if (!/^\d+$/.test(code)) return false;
  if (!GTIN_LENGTHS.includes(code.length)) return false;
  return gtinCheckDigit(code.slice(0, -1)) === Number(code.at(-1));
}

/**
 * GTIN-14로 올림 정규화한다.
 *
 * 선행 0은 체크디짓 가중합에 0을 더하므로 8·12·13 → 14는 무손실이다.
 * 반대 방향(14 → 13)은 선행 자리가 0일 때만 가능한 손실 변환이라 제공하지 않는다.
 *
 * 검증은 하지 않는다. 체크섬이 필요하면 {@link isValidGtinChecksum}을 먼저 호출한다.
 */
export function toGtin14(code: string): Gtin {
  const digits = code.replace(/\D/g, "");
  if (digits.length > 14) {
    throw new RangeError(`GTIN is longer than 14 digits: ${digits.length}`);
  }
  return digits.padStart(14, "0");
}
