/**
 * 화면에 보일 바코드 번호. 조회는 GTIN-14로 하지만 포장에 찍힌 자릿수(EAN-13 · UPC-A 12 · EAN-8)로 보인다.
 * 앞의 0을 떼고 가장 가까운 표준 자릿수(8 · 12 · 13 · 14)까지 다시 채운다(GTIN-14 → 13자리면 「8801234567893」).
 * 원래 자릿수는 GTIN-14로 바꾸며 잃으므로, 직접 입력한 비표준 자릿수(9~11)는 12자리로 보인다(앞에 0이 붙는다).
 */
export function displayGtin(gtin: string): string {
  const digits = gtin.replace(/^0+/, "");
  const length = [8, 12, 13, 14].find((n) => digits.length <= n) ?? 14;
  return digits.padStart(length, "0");
}
