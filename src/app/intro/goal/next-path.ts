// 다른 주소로 보내지 않게 제품 결과 주소만 받는다
const NEXT_PATTERN = /^\/product\/[\w-]+$/;

/** 1-5 「다음」 뒤에 돌아갈 주소(?next=). 제품 결과 주소 모양이 아니면 버린다 */
export function toNextPath(value: string | string[] | undefined) {
  return typeof value === "string" && NEXT_PATTERN.test(value)
    ? value
    : undefined;
}
