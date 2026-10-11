/**
 * 스플래시 배경이자 manifest theme_color. 스플래시 동안 상단 바를 배경과 맞추려는 것이고,
 * 앱 화면에서는 layout의 viewport.themeColor가 덮어쓴다.
 */
export const SPLASH_COLOR = "#2f6758";

/** maskable은 Android가 원·물방울 등으로 잘라 쓰는 아이콘. 로고를 안전영역(반경 40%) 안에 둔다 */
export const PWA_ICONS = [
  { size: 192, path: "/pwa/icon-192.png", purpose: "any" },
  { size: 512, path: "/pwa/icon-512.png", purpose: "any" },
  { size: 192, path: "/pwa/icon-maskable-192.png", purpose: "maskable" },
  { size: 512, path: "/pwa/icon-maskable-512.png", purpose: "maskable" },
] as const;

export const APPLE_ICON = { size: 180, path: "/pwa/apple-icon.png" } as const;

type IosScreen = { width: number; height: number; ratio: number };

/** iOS는 기기 해상도와 정확히 일치하는 스플래시만 띄우고, 없으면 흰 화면이다. 새 기종이 나오면 추가 */
export const IOS_SPLASH_SCREENS: IosScreen[] = [
  { width: 440, height: 956, ratio: 3 }, // 16 Pro Max, 17 Pro Max
  { width: 420, height: 912, ratio: 3 }, // Air
  { width: 402, height: 874, ratio: 3 }, // 16 Pro, 17, 17 Pro
  { width: 430, height: 932, ratio: 3 }, // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  { width: 393, height: 852, ratio: 3 }, // 14 Pro, 15, 15 Pro, 16
  { width: 428, height: 926, ratio: 3 }, // 12 Pro Max, 13 Pro Max, 14 Plus
  { width: 390, height: 844, ratio: 3 }, // 12, 13, 14, 16e
  { width: 375, height: 812, ratio: 3 }, // X, XS, 11 Pro, 12 mini, 13 mini
  { width: 414, height: 896, ratio: 3 }, // XS Max, 11 Pro Max
  { width: 414, height: 896, ratio: 2 }, // XR, 11
  { width: 414, height: 736, ratio: 3 }, // 8 Plus
  { width: 375, height: 667, ratio: 2 }, // SE 2·3세대, 8
];

export function iosSplashPath({ width, height, ratio }: IosScreen) {
  return `/pwa/splash/${width * ratio}x${height * ratio}.png`;
}

export function iosSplashMedia({ width, height, ratio }: IosScreen) {
  return `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`;
}
