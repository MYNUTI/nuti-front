/**
 * 동의 API의 DTO(서버 필드 그대로)와 화면 모델.
 * 기준: 배포 Swagger(2026-11-21)와 백엔드 `main` `1ddb9b4`의 `ConsentItemsResponse`, `ConsentsResponse`,
 * `ConsentChangeRequest`, `ConsentItemCode`. 날짜는 타임존 없는 ISO 문자열(`yyyy-MM-ddTHH:mm:ss`)이다.
 * 가입 동의는 `POST /auth/signup`(13-4c)이 같은 항목 코드로 받는다
 */

/** 필수 AGE_14·TERMS·PRIVACY, 선택 GOAL_ACCOUNT·BODY_PROFILE·MARKETING(v3 기능명세 ACCT_004) */
export type ConsentItemCode =
  | "AGE_14"
  | "TERMS"
  | "PRIVACY"
  | "GOAL_ACCOUNT"
  | "BODY_PROFILE"
  | "MARKETING";

/** 가입 뒤 켜고 끌 수 있는 선택 항목(ACCT_007). 필수 항목은 바꿀 수 없다(400) */
import type { Goal } from "@/lib/goal/types";

export type OptionalConsentItemCode =
  "GOAL_ACCOUNT" | "BODY_PROFILE" | "MARKETING";

// ── DTO ──────────────────────────────────────────────────────────────────────

/** `GET /meta/consent-items`. 가입 동의 화면에 그릴 항목 6개와 지금 약관·처리방침 판 */
export type ConsentItemsDto = {
  termsVersion: string | null;
  privacyVersion: string | null;
  items: { item: ConsentItemCode; label: string; required: boolean }[];
};

export type ConsentStateDto = {
  item: ConsentItemCode;
  label: string;
  required: boolean;
  agreed: boolean;
  /** 기록이 없으면 null */
  changedAt: string | null;
  termsVersion: string | null;
  privacyVersion: string | null;
  /** 동의문 판(목표 저장·몸 정보) */
  documentVersion: string | null;
};

/** `GET /me/consents`·`PUT /me/consents/{item}`. 항목 6개의 지금 상태(마지막 기록) */
export type ConsentsDto = { items: ConsentStateDto[] };

/**
 * `PUT /me/consents/{item}` 요청. 켤 때 GOAL_ACCOUNT는 `goal`(기기 목표)을 함께 보내면 계정에 저장한다.
 * BODY_PROFILE의 `bodyProfile`은 5-7 내 몸에 맞추기를 연결할 때 넣는다
 */
export type ConsentChangeDto = {
  agreed: boolean;
  documentVersion?: string;
  goal?: Goal;
};

// ── 화면 모델 ────────────────────────────────────────────────────────────────
// 서버가 null을 생략하지 않고(`@JsonInclude` 없음) 필드도 화면에서 그대로 써 mapper를 두지 않는다

export type ConsentItems = ConsentItemsDto;
export type ConsentState = ConsentStateDto;

export type ConsentChangeInput = {
  item: OptionalConsentItemCode;
  agreed: boolean;
  /** 동의문 판. 목표 저장·몸 정보 동의 시트가 보여 준 판을 보낸다 */
  documentVersion?: string;
};
