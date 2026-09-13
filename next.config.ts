import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // 실기기 카메라 테스트는 HTTPS가 필요해 터널을 쓴다. 빠뜨리면 dev 서버가 /_next/*를
  // 403으로 막아 하이드레이션이 실패하고, 화면에는 SSR HTML만 남아 원인을 찾기 어렵다.
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.app"],
  turbopack: { rules: { "*.wasm": { type: "asset" } } },
};

export default nextConfig;
