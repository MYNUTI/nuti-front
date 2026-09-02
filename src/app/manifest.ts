import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "마이뉴티",
    short_name: "마이뉴티",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f3f1",
    theme_color: "#f4f3f1",
  };
}
