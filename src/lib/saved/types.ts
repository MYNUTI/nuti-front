/**
 * 저장 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 백엔드 커밋 c164ec0의 `SavedProductPageResponse`, `SaveResultResponse`.
 * 날짜는 타임존 없는 ISO 문자열(`yyyy-MM-ddTHH:mm:ss`)이다.
 */
import type { OffsetPageDto } from "@/lib/api/types";
import type { GradeLetter, ProductStatus } from "@/lib/product/types";

// ── DTO ──────────────────────────────────────────────────────────────────────

/** `GET /me/saved-products`의 항목. 등급은 사용자 목표 기준이고, 서버는 등급이 없으면 INSUFFICIENT로 둔다 */
export type SavedProductDto = {
  productId: number;
  name: string;
  imageUrl: string | null;
  status: ProductStatus;
  /** INSUFFICIENT면 null */
  grade: GradeLetter | null;
  /** INSUFFICIENT면 null. 등급이 있으면 서버가 기본 문구로라도 채운다 */
  label: string | null;
  savedAt: string;
};

export type SavedProductPageDto = OffsetPageDto<SavedProductDto>;

/** `POST`·`DELETE /me/saved-products/{productId}`. 둘 다 멱등이다 */
export type SaveResultDto = {
  saved: boolean;
  /** 저장(POST)일 때만 온다 */
  savedCount?: number;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

/** 상품 결과와 같은 방식으로 등급 유무를 status로 나눈다 */
export type SavedProduct = {
  /** 상세 경로와 맞춰 문자열 */
  id: string;
  name: string;
  imageUrl: string | null;
  savedAt: string;
} & (
  | { status: "ANALYZED"; grade: GradeLetter; label: string }
  | { status: "INSUFFICIENT" }
);

export type SavedProductPage = {
  items: SavedProduct[];
  totalCount: number;
  hasNext: boolean;
};
