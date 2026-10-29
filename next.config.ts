import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => ({
  reactCompiler: true,
  // 실기기 카메라 테스트는 HTTPS가 필요해 터널을 쓴다. 빠뜨리면 dev 서버가 /_next/*를
  // 403으로 막아 하이드레이션이 실패하고, 화면에는 SSR HTML만 남아 원인을 찾기 어렵다.
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.app"],
  turbopack: { rules: { "*.wasm": { type: "asset" } } },
  // 브라우저가 백엔드를 직접 부르면 CORS에 막혀 같은 origin의 /api로 중계한다. source는
  // NEXT_PUBLIC_API_URL 값과 같아야 한다. 목적지는 빌드할 때 routes-manifest에 고정되므로
  // API_URL은 next build 시점에도 있어야 한다(server.ts는 next start 시점에 읽는다)
  rewrites: async () => {
    const apiUrl = process.env.API_URL?.replace(/\/+$/, "");
    if (!apiUrl) {
      // 개발 중에는 운영 서버를 부르지 않으므로(「진행 가정」) API_URL 없이 기동되게 둔다.
      // dev에 API_URL을 넣으면 운영 서버로 중계된다. next start는 이 함수를 다시 부르지 않고 routes-manifest를 쓴다
      if (phase !== PHASE_PRODUCTION_BUILD) return [];
      // 빈 문자열(.env.example 그대로)이면 목적지가 "/:path*"인 내부 rewrite가 되어 에러 없이
      // /api/onboarding/consent가 프론트 페이지로 가므로 여기서 막는다
      throw new Error(
        "API_URL 환경변수가 없습니다. .env.example을 참고해 백엔드 주소를 넣어 주세요",
      );
    }
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
});

export default nextConfig;
