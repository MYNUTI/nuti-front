import type { PolicySection } from "@/components/policy/policy-doc";

/*
 * 약관 본문은 정하지 않았다(【최종】 메모 「안 정함: 약관 본문(ACCT_003a)」, 변호사 확인 전).
 * 제1조만 그림에 문장이 있어 그대로 넣고, 나머지는 조항 제목만 그림대로 둔다.
 * 시행일 「0000. 00. 00.」도 자리 표시라 확정된 날짜로 바꾼다.
 */
const PENDING = "약관 본문을 정하는 중이에요.";

export const TERMS_EFFECTIVE_DATE = "0000. 00. 00.";

export const TERMS_SECTIONS: PolicySection[] = [
  {
    title: "제1조 목적",
    body: '이 약관은 마이뉴티(이하 "서비스")의 이용 조건과 절차, 회사와 이용자의 권리 · 의무를 정합니다.',
  },
  { title: "제2조 용어의 뜻", body: PENDING },
  { title: "제3조 약관의 효력과 변경", body: PENDING },
  { title: "제4조 서비스의 내용", body: PENDING },
  { title: "제5조 점수 정보의 성격", body: PENDING },
  { title: "제6조 이용자의 의무", body: PENDING },
  { title: "제7조 게시물과 제보", body: PENDING },
  { title: "제8조 서비스의 중단", body: PENDING },
  { title: "제9조 책임의 한계", body: PENDING },
  { title: "제10조 분쟁 해결", body: PENDING },
];
