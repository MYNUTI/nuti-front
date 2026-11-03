/**
 * 목표 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 백엔드 커밋 c164ec0의 `GoalResponse`, `GoalUpdateRequest`, `GoalUpdateResponse`.
 * 날짜는 타임존 없는 ISO 문자열(`yyyy-MM-ddTHH:mm:ss`)이다.
 */
import type { GradeLetter } from "@/lib/product/types";

/** 목표는 상품·온보딩·설정이 같이 쓴다 */
export type Goal = "GENERAL" | "WEIGHT_LOSS" | "MUSCLE_GAIN";

// ── DTO ──────────────────────────────────────────────────────────────────────

/** `GET /me/goal`. 식별이 없거나 미설정이어도 GENERAL로 정상 응답한다 */
export type GoalDto = {
  goal: Goal;
  label: string;
  healthConsented: boolean;
  /** 미설정이면 없다 */
  appliedAt?: string;
};

/** `PUT /me/goal` 요청 */
export type GoalUpdateRequestDto = {
  goal: Goal;
  /** 주면 그 상품의 바뀌기 전·후 등급을 응답에 함께 준다 */
  recalcProductId?: number;
};

/** `PUT /me/goal` */
export type GoalUpdateDto = {
  goal: Goal;
  label: string;
  appliedAt: string;
  /** `recalcProductId`를 안 보냈거나 그 상품이 없거나·비활성·등급 없음이면 null. 화면은 재계산 단계를 건너뛴다 */
  recalculation: RecalculationDto | null;
};

export type RecalculationDto = {
  productId: number;
  name: string;
  before: RecalculatedGradeDto;
  after: RecalculatedGradeDto;
  /** false(변화 없음)도 정상이다 */
  changed: boolean;
  /** 서버가 만든 완성 문장 */
  reason: string;
};

export type RecalculatedGradeDto = {
  grade: GradeLetter;
  /** DB 문구가 없으면 서버가 기본 문구로 채운다(`CalibrationService.label`) */
  label: string;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────

export type MyGoal = Omit<GoalDto, "appliedAt"> & { appliedAt: string | null };

export type Recalculation = Omit<RecalculationDto, "productId"> & {
  /** 상세 경로와 맞춰 문자열 */
  productId: string;
};

export type GoalUpdate = Omit<GoalUpdateDto, "recalculation"> & {
  recalculation: Recalculation | null;
};
