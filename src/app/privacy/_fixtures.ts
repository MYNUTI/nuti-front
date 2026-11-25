import type { PolicySection } from "@/components/policy/policy-doc";

/*
 * 처리방침 본문은 정하지 않았다(【최종】 메모 「안 정함: 처리방침 본문(ACCT_003a, ACCT_009)」).
 * 「1. 처리하는 개인정보 항목」만 그림에 지금 설계 기준 요약이 있어 그대로 넣고, 나머지는 목차 제목만 그림대로 둔다.
 * 목차는 법정 기재 사항 순서를 따른다(메모). 시행일 「0000. 00. 00.」도 자리 표시라 확정된 날짜로 바꾼다.
 */
const PENDING = "처리방침 본문을 정하는 중이에요.";

export const PRIVACY_EFFECTIVE_DATE = "0000. 00. 00.";

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    title: "1. 처리하는 개인정보 항목",
    body: [
      {
        heading: "로그인하지 않아도",
        text: "기기 번호, 접속 일시, 브라우저 종류, 본 제품",
      },
      { heading: "직접 올린 것", text: "요청한 제품 정보, 영양성분표 사진" },
      {
        heading: "로그인할 때",
        text: "이메일, 닉네임, 계정 식별자\n(카카오, 네이버, 구글에서 받아요)",
      },
      {
        heading: "선택해서 동의한 경우",
        text: "고른 목표, 몸 정보(성별, 출생 연도, 키, 체중, 활동량), 계산한 하루 필요 칼로리 — 민감정보",
      },
    ],
  },
  { title: "2. 처리 목적", body: PENDING },
  { title: "3. 보유 · 이용 기간", body: PENDING },
  { title: "4. 파기 절차와 방법", body: PENDING },
  { title: "5. 제3자 제공", body: PENDING },
  { title: "6. 처리 위탁", body: PENDING },
  { title: "7. 국외 이전", body: PENDING },
  { title: "8. 안전성 확보 조치", body: PENDING },
  // 메모: 목적 · 기간 · 항목 · 안전조치를 적는다
  { title: "9. 가명정보 처리", body: PENDING },
  { title: "10. 자동으로 수집하는 장치와 거부 방법", body: PENDING },
  { title: "11. 이용자의 권리와 행사 방법", body: PENDING },
  { title: "12. 개인정보 보호책임자", body: PENDING },
  { title: "13. 처리방침의 변경", body: PENDING },
];

/*
 * 5-10b 기기 번호(【최종】 그림 값) · 보낼 곳(임의 값 — 그림 값은 개인 메일이라 쓰지 않는다). 5-5 설정도 같은 시트를 띄워 여기서 가져간다.
 * 기기 번호는 API 연결 때 익명 ID(`readIdentity().anonymousId`)로 바꾼다. 보낼 곳은 안 정함(ACCT_009)
 */
export const FIXTURE_DEVICE_ID = "a1b2c3d4-e5f6-7890";
export const DELETE_REQUEST_EMAIL = "privacy@nuti.example";
