/*
 * 안드로이드 크롬의 설치 창 신호(`beforeinstallprompt`). 페이지를 처음 열 때 한 번 오므로, 4-1 「홈 화면에 추가」
 * 시트가 열리기 전에 지나가지 않게 이 모듈이 불러와지는 순간(화면이 준비되기 전) 받기 시작한다.
 * 레이아웃의 `InstallPromptCatcher`가 이 모듈을 첫 화면 번들에 넣는다. 늦게 오면 구독한 쪽에 알린다.
 * 표준 타입이 없어(크로뮴 전용) 쓰는 만큼만 적는다.
 */
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function catchInstallPrompt(event: Event) {
  // 브라우저가 스스로 띄우는 작은 설치 띠 대신 우리 시트에서 띄운다
  event.preventDefault();
  deferred = event as InstallPromptEvent;
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  // 개발 중 모듈을 다시 불러오면 앞서 붙인 리스너를 떼고 새로 붙인다(겹쳐 받지 않게)
  const w = window as Window & { __nutiCatchInstall?: (event: Event) => void };
  if (w.__nutiCatchInstall)
    window.removeEventListener("beforeinstallprompt", w.__nutiCatchInstall);
  w.__nutiCatchInstall = catchInstallPrompt;
  window.addEventListener("beforeinstallprompt", catchInstallPrompt);
}

export function getInstallPrompt() {
  return deferred;
}

/** 설치 창은 한 번만 띄울 수 있다. 띄운 뒤에는 지운다 */
export async function showInstallPrompt() {
  const event = deferred;
  deferred = null;
  listeners.forEach((listener) => listener());
  if (!event) return "unavailable" as const;
  await event.prompt();
  return (await event.userChoice).outcome;
}
