import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
