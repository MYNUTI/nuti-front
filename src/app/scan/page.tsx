import type { Metadata } from "next";
import { TabBar } from "@/components/common/tab-bar";
import { ScanStage } from "@/components/scan/scan-stage";

export const metadata: Metadata = {
  title: "스캔",
};

export default function ScanPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-32">
        <ScanStage />
      </div>

      <TabBar />
    </main>
  );
}
