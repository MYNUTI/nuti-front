import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제품 스캔",
};

export default function OnboardingScanPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-1">
      <p className="text-base font-bold">1-2 온보딩 스캔</p>
      <p className="text-sm text-muted-foreground">/onboarding/scan</p>
    </main>
  );
}
