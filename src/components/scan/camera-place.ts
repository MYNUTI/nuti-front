/*
 * 카메라를 열 수 없는 곳인지 본다(3-1 스캔 · 카메라를 못 여는 곳).
 *   앱 안 브라우저(카카오톡 등): 디자인 메모대로 카메라가 열리지 않는 곳으로 보고 다른 브라우저로 열기를 권한다
 *   PC: 터치 없이 마우스가 주 입력인 기기. 웹캠이 있어도 바코드를 찍기 어려워 PC 안내를 보인다
 * 브라우저에서만 부른다(navigator·matchMedia).
 */
export type CameraPlace =
  | { kind: "ok" }
  | { kind: "pc" }
  | {
      kind: "in-app";
      /** 제목 「○○ 안에서는」에 넣는 이름 */
      app: string;
      /** 바깥 브라우저로 여는 주소. 웹에서 열 방법이 없는 곳(아이폰의 카카오톡 밖 앱 등)은 없다 */
      openExternal?: (url: string) => string;
    };

// 사용자 에이전트에 앱 이름이 들어가는 앱 안 브라우저. 흔한 곳만 둔다
const IN_APP: { pattern: RegExp; app: string }[] = [
  { pattern: /KAKAOTALK/i, app: "카카오톡" },
  { pattern: /NAVER\(inapp/i, app: "네이버" },
  { pattern: /Instagram/i, app: "인스타그램" },
  { pattern: /FBAN|FBAV/i, app: "페이스북" },
  { pattern: /\bLine\//i, app: "라인" },
];

// 카카오톡이 바깥 브라우저로 넘기는 주소. 공식 문서는 없고 개발자들이 쓰는 방법이라 동작은 기기에서 확인해야 한다
const kakaoExternal = (url: string) =>
  `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;

// 안드로이드는 intent 주소로 크롬을 지정해 열 수 있다
const androidChrome = (url: string) => {
  const { host, pathname, search } = new URL(url);
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;end`;
};

export function detectCameraPlace(): CameraPlace {
  const ua = navigator.userAgent;
  const inApp = IN_APP.find(({ pattern }) => pattern.test(ua));
  if (inApp) {
    const openExternal =
      inApp.app === "카카오톡"
        ? kakaoExternal
        : /Android/i.test(ua)
          ? androidChrome
          : undefined;
    return { kind: "in-app", app: inApp.app, openExternal };
  }
  const pc =
    !matchMedia("(any-pointer: coarse)").matches &&
    matchMedia("(pointer: fine)").matches;
  return pc ? { kind: "pc" } : { kind: "ok" };
}
