import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "처리방침 동의",
};

export default function ConsentPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-1">
      <p className="text-base font-bold">0-2 처리방침 동의</p>
      <p className="text-sm text-muted">/onboarding/consent</p>
    </main>
  );
}
