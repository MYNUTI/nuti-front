import type { MetadataRoute } from "next";
import { SPLASH_COLOR, PWA_ICONS } from "@/lib/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "마이뉴티",
    short_name: "마이뉴티",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: SPLASH_COLOR,
    theme_color: SPLASH_COLOR,
    icons: PWA_ICONS.map(({ size, path, purpose }) => ({
      src: path,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose,
    })),
  };
}
