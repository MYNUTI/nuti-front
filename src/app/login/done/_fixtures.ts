/*
 * 5-6b 연결 완료 임시 데이터. 값은 【최종】 5-6b 프레임 그대로다. 로그인 API(`POST /auth/oauth`)를 붙이면
 * 응답(닉네임 · 이메일 · `mergedRecordCount`)으로 바꾼다. 이메일은 서버가 가려 주지 않으면 화면에서 가린다.
 */
export type MovedRecords = { recent: number; saved: number; requests: number };

export const FIXTURE_DONE = {
  nickname: "마이뉴티사용자",
  maskedEmail: "ab***@kakao.com",
  records: { recent: 12, saved: 3, requests: 3 } satisfies MovedRecords,
};
