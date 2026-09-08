import type { Metadata } from "next";
import { TabBar } from "@/components/common/tab-bar";

export const metadata: Metadata = {
  title: "내 기록",
};

export default function HistoryPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="flex flex-1 flex-col items-center justify-center gap-1 pb-32">
        <p className="text-base font-bold">4-1 내 기록</p>
        <p className="text-sm text-muted-foreground">/history</p>
      </div>

      <TabBar />
    </main>
  );
}
