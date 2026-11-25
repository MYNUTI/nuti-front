import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 날짜 테스트가 기기 시간대(개발 기기는 KST)에 기대지 않게 UTC로 고정한다. 「한국 시간 기준」 테스트는 KST 기기에서 판별력이 없다
    env: { TZ: "UTC" },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only`는 Next가 빌드에서 처리해 설치하지 않았다. 테스트에서는 빈 모듈로 대신한다
      "server-only": fileURLToPath(
        new URL("./src/test/empty-module.ts", import.meta.url),
      ),
    },
  },
});
