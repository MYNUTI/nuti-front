import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
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
  title: "마이뉴티",
  description: "",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
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
