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

export type GtinInputCheck =
  "empty" | "valid" | "checksum-mismatch" | "nonstandard-length";

/**
 * 직접 입력한 숫자열을 판정한다. 숫자만 들어온다고 가정한다.
 *
 * **UPC-E(8자리 압축형)는 지원하지 않는다.** 숫자만으로는 EAN-8과 구별할 수 없어 EAN-8
 * 규칙으로 검사하므로, UPC-E 번호는 대부분 `checksum-mismatch`로, 약 10%는 우연히
 * `valid`로 판정된다. 조회 시에도 UPC-A로 펼치지 않고 0을 채우므로 다른 GTIN이 된다.
 * 카메라 경로는 `upc_e`를 포맷에서 빼서 같은 문제를 피한다. 국내 상품은 빈도가 낮다.
 *
 * **`empty`만 제출을 막는다.** 체크섬이 틀리거나 자릿수가 표준이 아니어도 사내 코드나
 * 비표준 바코드일 수 있어 경고만 한다. 빈 값을 막는 이유는 `toGtin14("")`가
 * `"00000000000000"`이라는 그럴듯한 값을 만들기 때문이다.
 */
export function checkGtinInput(digits: string): GtinInputCheck {
  if (digits === "") return "empty";
  if (!GTIN_LENGTHS.includes(digits.length)) return "nonstandard-length";
  return isValidGtinChecksum(digits) ? "valid" : "checksum-mismatch";
}
