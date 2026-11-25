import type { BodyProfile } from "./body-input";

/** 5-7(이미 맞췄을 때) 미리보기 값 — 【최종】 그림 그대로. API 연결 때 `GET /me/body-profile`(이 기기 값이 먼저)로 바꾼다 */
export const FIXTURE_BODY_PROFILE: BodyProfile = {
  gender: "MALE",
  birthYear: 1998,
  heightCm: 175,
  weightKg: 70,
  activity: "LOW_ACTIVE",
};
