import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  eslintConfigPrettier,

  // 디코딩 라이브러리는 lib/scan/wasm.ts와 lib/scan/use-scanner.ts 두 곳에서만 들여온다.
  // 인식률 측정 결과에 따라 워커나 상용 SDK로 갈아탈 수 있는데, 이음매가 이 둘로
  // 묶여 있어야 그 변경이 UI까지 번지지 않는다. 근거는
  // docs/바코드-스캔-구현-플랜.md §0·§4.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/scan/wasm.ts", "src/lib/scan/use-scanner.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react-zxing",
                "react-zxing/*",
                "barcode-detector",
                "barcode-detector/*",
                "zxing-wasm",
                "zxing-wasm/*",
              ],
              message:
                "디코딩 라이브러리는 lib/scan/wasm.ts와 lib/scan/use-scanner.ts에서만 import한다. 필요한 것을 그 모듈에서 내보내 쓸 것.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
