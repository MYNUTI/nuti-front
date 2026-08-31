import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "설정",
};

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-1">
      <p className="text-base font-bold">5-5 설정</p>
      <p className="text-sm text-muted">/settings</p>
    </main>
  );
}
