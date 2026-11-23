/**
 * 저장(즐겨찾기) API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 배포 Swagger(2026-11-21)와 백엔드 `main` `1ddb9b4`의 `SavedProductPageResponse`, `SaveResultResponse`.
 * 항목 모양은 Swagger의 스키마 이름 충돌로 가려져 백엔드 소스로 확인했다(API v3 동기화 문서).
 * 날짜는 타임존 없는 ISO 문자열(`yyyy-MM-ddTHH:mm:ss`)이다.
 */
import type { Goal } from "@/lib/goal/types";
import type { ProductCardData, ProductCardDto } from "@/lib/product/types";

// ── DTO ──────────────────────────────────────────────────────────────────────

/**
 * `GET /me/saved-products`. 저장한 순(최근 먼저). 단종·생산 중단 제품도 상태(`product.state`)로 남고
 * 비활성 제품만 빠진다. 카드의 태그·`better`는 요청한 `goal` 기준이다
 */
export type SavedProductPageDto = {
  goal: Goal;
  kcalBand: number;
  totalCount: number;
  hasNext: boolean;
  items: { product: ProductCardDto; savedAt: string }[];
};

/** `POST`·`DELETE /me/saved-products/{productId}`. 둘 다 멱등이다 */
export type SaveResultDto = {
  saved: boolean;
  /** 저장(POST)일 때만 온다 */
  savedCount?: number;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

export type SavedProduct = {
  product: ProductCardData;
  savedAt: string;
};

export type SavedProductPage = {
  items: SavedProduct[];
  totalCount: number;
  hasNext: boolean;
};
