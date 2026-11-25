/*
 * 광고성 정보 수신 동의 · 철회 결과 알림(법 의무 — 바꾼 날짜를 알린다). 5-6c(가입 중 동의) · 5-5b(동의 관리)가 쓴다.
 * 문장은 【최종】 메모 그대로이고 변호사 확인 전이다. 날짜는 브라우저 시계의 그날.
 * 알림 띠(Toast)는 마운트 뒤에 문장을 그려, 서버 · 브라우저 날짜가 달라도 hydration이 어긋나지 않는다.
 */
export function adsConsentMessage(agreed: boolean, now = new Date()) {
  const date = `${now.getMonth() + 1}월 ${now.getDate()}일`;
  return agreed
    ? `${date} 마이뉴티 광고성 정보 수신에 동의했어요`
    : `${date} 마이뉴티 광고성 정보 수신을 철회했어요`;
}
