// v3는 첫 실행 여부와 온보딩 완료를 기기가 기억한다(기능명세 ONB_001 · ONB_004, 서버 API 없음).
// 사이트 데이터 저장을 막은 브라우저는 localStorage에 접근만 해도 SecurityError를 던진다. 완료 기록은 화면 흐름을
// 막으면 안 돼 둘 다 삼킨다. 이때는 기억하지 못해 다음 실행에 처음 실행 흐름을 다시 본다(ONB_004 「기기 저장이 막힘」)
const ONBOARDING_COMPLETED_KEY = "nuti_onboarding_completed";

/** 1-5 「이 목표로 시작」처럼 온보딩을 마친 순간 부른다 */
export function rememberOnboardingCompleted() {
  try {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "1");
  } catch {
    // 위 주석 참고
  }
}

/** 서버 렌더에는 localStorage가 없어 false다. 첫 실행 분기는 브라우저에서 한다 */
export function isOnboardingCompletedLocally(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "1";
  } catch {
    return false;
  }
}

/** 계정 삭제 뒤 이 기기를 처음 방문 상태로 돌릴 때 부른다(ACCT_008) */
export function forgetOnboardingCompleted() {
  try {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch {
    // 위 주석 참고
  }
}
