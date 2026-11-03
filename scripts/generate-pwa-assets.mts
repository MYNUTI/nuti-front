/**
 * PWA 아이콘과 iOS 스플래시 이미지를 만든다.
 * - 아이콘: 초록 바탕 + public/common/logo.png(투명 배경 흰 로고)
 * - 스플래시: 흰 바탕(SPLASH_COLOR) + public/common/splash-wordmark.png(피그마 0-1처럼 「마이뉴티」 글자만)
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
const LOGO = path.join(ROOT, "public/common/logo.png");
/*
 * Pretendard Bold 84px(피그마 Display 28pt의 3배), brand/link 색, 투명 배경으로 그린 글자 이미지.
 * sharp의 글자 그리기는 이 환경에서 글꼴 지정이 먹지 않아, 앱 글꼴로 한 번 그려 둔 이미지를 쓴다.
 * 글자·색·글꼴이 바뀌면 이 이미지를 다시 만든다.
 */
const WORDMARK = path.join(ROOT, "public/common/splash-wordmark.png");
const WORDMARK_RATIO = 3;
const PUBLIC_DIR = path.join(ROOT, "public");

// 아이콘은 v3 토큰 교체 전 디자인 그대로 둔다(UI 플랜 결정 기록)
const ICON_COLOR = "#2f6758";

const ICON_LOGO_RATIO = 0.6;
// Android 12+ 스플래시는 maskable 아이콘을 240dp로 그린다. 로고가 시안의 104dp가 되도록 맞춘 값
const MASKABLE_LOGO_RATIO = 0.43;

async function render(
  width: number,
  height: number,
  source: string,
  sourceWidth: number,
  publicPath: string,
  background: string,
) {
  const mark = await sharp(source)
    .resize({ width: Math.round(sourceWidth) })
    .toBuffer();
  const out = path.join(PUBLIC_DIR, publicPath);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp({
    create: { width, height, channels: 3, background },
  })
    .composite([{ input: mark, gravity: "center" }])
    .removeAlpha()
    .png()
    .toFile(out);
  console.log(`${publicPath} (${width}x${height})`);
}

for (const { size, path: p, purpose } of PWA_ICONS) {
  const ratio = purpose === "maskable" ? MASKABLE_LOGO_RATIO : ICON_LOGO_RATIO;
  await render(size, size, LOGO, size * ratio, p, ICON_COLOR);
}
await render(
  APPLE_ICON.size,
  APPLE_ICON.size,
  LOGO,
  APPLE_ICON.size * ICON_LOGO_RATIO,
  APPLE_ICON.path,
  ICON_COLOR,
);

const wordmarkWidth = (await sharp(WORDMARK).metadata()).width;
for (const screen of IOS_SPLASH_SCREENS) {
  await render(
    screen.width * screen.ratio,
    screen.height * screen.ratio,
    WORDMARK,
    (wordmarkWidth / WORDMARK_RATIO) * screen.ratio,
    iosSplashPath(screen),
    SPLASH_COLOR,
  );
}
