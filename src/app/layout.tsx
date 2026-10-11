import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import {
  APPLE_ICON,
  IOS_SPLASH_SCREENS,
  iosSplashMedia,
  iosSplashPath,
} from "@/lib/pwa";
import Providers from "./providers";

const paperlogy = localFont({
  src: [
    { path: "./fonts/Paperlogy-5Medium.woff2", weight: "500" },
    { path: "./fonts/Paperlogy-7Bold.woff2", weight: "700" },
  ],
  variable: "--font-paperlogy",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "마이뉴티",
    template: "%s · 마이뉴티",
  },
  description: "",
  robots: { index: false, follow: false },
  icons: { apple: APPLE_ICON.path },
  appleWebApp: {
    title: "마이뉴티",
    startupImage: IOS_SPLASH_SCREENS.map((screen) => ({
      url: iosSplashPath(screen),
      media: iosSplashMedia(screen),
    })),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f3f1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${paperlogy.variable} h-full`}>
      <body className="min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-background">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
