import type { Metadata } from "next";
import { TabBar } from "@/components/common/tab-bar";

export const metadata: Metadata = {
  title: "스캔",
};

export default function ScanPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="flex flex-1 flex-col items-center justify-center gap-1 pb-32">
        <p className="text-base font-bold">3-1 바코드 스캔</p>
        <p className="text-sm text-muted-foreground">/scan</p>
      </div>

      <TabBar />
    </main>
  );
}
