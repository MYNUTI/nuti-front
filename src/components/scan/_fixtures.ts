/*
 * 3-6 아직 점수가 없는 제품 시트의 임시 데이터. 지금 목 조회(lib/scan/lookup.ts)는 「없음」에 바코드만 돌려준다.
 * API 연결 때 바코드 조회 응답(식약처 바코드 목록의 이름 · 회사, 요청 상태)으로 바꾼다.
 * 체크 디지트가 맞는 번호를 썼다(【최종】 그림의 8801234567890은 체크 디지트가 틀린 예시 번호).
 */
import type { Gtin } from "@/lib/scan/types";

/** 3-6(이름을 아는 바코드): 식약처 바코드 목록에 이름 · 회사만 있고 영양 정보는 없는 제품 */
export const FIXTURE_NAMED_BARCODES: Record<
  Gtin,
  { brand: string; name: string }
> = {
  "08801234567893": { brand: "농심", name: "포테토칩 짭짤한맛" },
};

/**
 * 3-6 메모 「이럴 땐」: 다른 사람이 먼저 요청한 바코드 · 이 기기에서 이미 요청한 바코드.
 * 이 기기에서 요청한 것은 3-6 제품 요청하기가 기기에 남긴 것(`requested-gtins.ts`)도 함께 본다
 */
export const FIXTURE_REQUESTED: Record<Gtin, "others" | "mine"> = {
  "08801000000012": "others",
  "08801000000029": "mine",
};
