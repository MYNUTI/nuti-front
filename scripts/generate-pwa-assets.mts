/**
 * public/common/logo.png(투명 배경 흰 로고)로 PWA 아이콘과 iOS 스플래시 이미지를 만든다.
 * 실행: pnpm pwa:assets
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  APPLE_ICON,
  SPLASH_COLOR,
  IOS_SPLASH_SCREENS,
  PWA_ICONS,
  iosSplashPath,
} from "../src/lib/pwa.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "public/common/logo.png");
const PUBLIC_DIR = path.join(ROOT, "public");

const ICON_LOGO_RATIO = 0.6;
// 로고 대각 반지름이 약 0.33으로 maskable 안전영역(0.4) 안에 들어온다
const MASKABLE_LOGO_RATIO = 0.5;
// 시안 기준 로고 폭(pt). 기기 폭과 무관하게 같은 크기로 보이도록 배율만 곱한다
const SPLASH_LOGO_PT = 104;

async function render(
  width: number,
  height: number,
  logoWidth: number,
  publicPath: string,
) {
  const logo = await sharp(SOURCE)
    .resize({ width: Math.round(logoWidth) })
    .toBuffer();
  const out = path.join(PUBLIC_DIR, publicPath);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp({
    create: { width, height, channels: 3, background: SPLASH_COLOR },
  })
    .composite([{ input: logo, gravity: "center" }])
    .removeAlpha()
    .png()
    .toFile(out);
  console.log(`${publicPath} (${width}x${height})`);
}

for (const { size, path: p, purpose } of PWA_ICONS) {
  const ratio = purpose === "maskable" ? MASKABLE_LOGO_RATIO : ICON_LOGO_RATIO;
  await render(size, size, size * ratio, p);
}
await render(
  APPLE_ICON.size,
  APPLE_ICON.size,
  APPLE_ICON.size * ICON_LOGO_RATIO,
  APPLE_ICON.path,
);

for (const screen of IOS_SPLASH_SCREENS) {
  const width = screen.width * screen.ratio;
  const height = screen.height * screen.ratio;
  await render(
    width,
    height,
    SPLASH_LOGO_PT * screen.ratio,
    iosSplashPath(screen),
  );
}
