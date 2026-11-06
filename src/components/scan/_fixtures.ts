/*
 * 스캔 결과 시트 임시 데이터. 지금 목 조회(lib/scan/lookup.ts의 lookupProduct)는 이름·요약·등급만 돌려줘서
 * 시트가 쓰는 나머지 값(브랜드·사진·점수·순위)을 상품 ID별로 채운다.
 * API 06단계에서 실제 바코드 조회(lookupBarcode)로 바꾸면 브랜드·사진·점수는 응답에서, 순위는 응답에 없어 빠진다.
 */
import type { ScanSheetProduct } from "./scan-result-sheet";

type Extra = Pick<ScanSheetProduct, "brand" | "imageUrl" | "score" | "rank">;

// 점수는 목 등급(A~E)의 구간 안 값으로 둔다. 순위는 디자인 예시(48개 중 12위)를 한 상품에만 넣어 없을 때 모양도 보인다
export const FIXTURE_SCAN_EXTRA: Record<string, Extra> = {
  "1": { brand: null, imageUrl: null, score: 34, rank: null },
  "2": {
    brand: null,
    imageUrl: null,
    score: 88,
    rank: { position: 12, total: 48 },
  },
};

export const FIXTURE_SCAN_GOAL_LABEL = "다이어트 목표";
