import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "스캔 결과",
};

export default function OnboardingResultPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-1">
      <p className="text-base font-bold">1-3 온보딩 결과</p>
      <p className="text-sm text-muted">/onboarding/result</p>
    </main>
  );
}
