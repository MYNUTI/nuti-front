import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  APPLE_ICON,
  IOS_SPLASH_SCREENS,
  PWA_ICONS,
  iosSplashPath,
} from "@/lib/pwa";

const PUBLIC_DIR = path.resolve(import.meta.dirname, "../../public");

const EXPECTED = [
  ...[...PWA_ICONS, APPLE_ICON].map(({ size, path }) => ({
    path,
    width: size,
    height: size,
  })),
  ...IOS_SPLASH_SCREENS.map((screen) => ({
    path: iosSplashPath(screen),
    width: screen.width * screen.ratio,
    height: screen.height * screen.ratio,
  })),
];

// 등록만 하고 pnpm pwa:assets를 안 돌리면 iOS는 에러 없이 흰 화면을 띄운다.
describe("PWA 에셋", () => {
  it.each(EXPECTED)(
    "$path → $width×$height PNG",
    async ({ path: publicPath, width, height }) => {
      const meta = await sharp(path.join(PUBLIC_DIR, publicPath)).metadata();
      expect(meta.format).toBe("png");
      expect([meta.width, meta.height]).toEqual([width, height]);
    },
  );

  it("public/pwa에는 등록된 파일만 있다", async () => {
    const entries = await readdir(path.join(PUBLIC_DIR, "pwa"), {
      recursive: true,
      withFileTypes: true,
    });
    const actual = entries
      .filter((entry) => entry.isFile())
      .map((entry) =>
        path.posix.join(
          "/",
          path.relative(PUBLIC_DIR, path.join(entry.parentPath, entry.name)),
        ),
      );
    expect(actual.sort()).toEqual(EXPECTED.map((e) => e.path).sort());
  });
});
