/*
 * 내 정보 임시 데이터. API 연결 전까지 쓰고, 연결할 때 이 import를 쿼리 훅으로 바꾼다(UI 플랜 「데이터」).
 * 값은 디자인 5-1 내 정보 프레임 그대로다.
 */
export type Goal = "diet" | "muscle";

export type LoginProvider = "kakao" | "naver" | "google";

export type MyAccount = { nickname: string; provider: LoginProvider };

export type MyInfo = {
  /** 로그인 전이면 null */
  account: MyAccount | null;
  goal: Goal;
  /** 내 몸에 맞춘 하루 칼로리. 맞추지 않았으면 null(기본 2,000kcal) */
  bodyKcal: number | null;
};

export const FIXTURE_ACCOUNT: MyAccount = {
  nickname: "마이뉴티사용자",
  provider: "kakao",
};

export const FIXTURE_GOAL: Goal = "diet";

export const FIXTURE_BODY_KCAL = 2_500;

/** 문의하기 받는 곳. 【최종】 5-1 메모의 주소는 개인 메일이라 임의 값을 둔다(.example은 예약 도메인). API 연결 때 서버 설정값(`MeSettings.supportUrl`)으로 바꿀지 정한다 */
export const FIXTURE_INQUIRY_URL = "mailto:help@nuti.example";
