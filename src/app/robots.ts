import type { MetadataRoute } from "next";

// 색인 차단은 layout.tsx의 metadata.robots(noindex)가 담당한다.
// 여기서 Disallow로 막으면 크롤러가 noindex를 읽지 못해 기존 색인이 남는다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
