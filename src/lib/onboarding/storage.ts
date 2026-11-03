// 동의 전에 온보딩을 끝내면 서버에 저장할 ID가 없어(`persisted: false`) 완료를 이 기기에 기억한다.
// 나중에 서버와 동기화하는 방식은 아직 정해지지 않았다(API 작업 플랜 「남은 질문」).
// 사이트 데이터 저장을 막은 브라우저는 localStorage에 접근만 해도 SecurityError를 던진다. 읽기는 bootstrap
// select 안에서, 쓰기는 온보딩 완료 onSuccess 안에서 불려 던지면 bootstrap 전체나 서버에 저장된 완료가
// 실패로 바뀌므로 둘 다 삼킨다. 이때는 기억하지 못해 온보딩을 다시 보게 된다
const ONBOARDING_COMPLETED_KEY = "nuti_onboarding_completed";

export function rememberOnboardingCompleted() {
  try {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "1");
  } catch {
    // 위 주석 참고
  }
}

/** 서버 렌더에는 localStorage가 없어 false다. 그래서 bootstrap은 서버에서 prefetch하지 않는다(hydration 불일치) */
export function isOnboardingCompletedLocally(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "1";
  } catch {
    return false;
  }
}
