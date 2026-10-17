import type { Metadata } from "next";
import { OnboardingIntro } from "./onboarding-intro";

export const metadata: Metadata = {
  title: "서비스 소개",
};

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <OnboardingIntro />
    </main>
  );
}
