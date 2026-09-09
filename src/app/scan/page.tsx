import type { Metadata } from "next";
import { CtaButton } from "@/components/common/cta-button";
import { TabBar } from "@/components/common/tab-bar";
import type { ScanResult } from "@/components/scan/scan-result-sheet";
import { ScanStage } from "@/components/scan/scan-stage";

export const metadata: Metadata = {
  title: "스캔",
};

const RESULTS: ScanResult[] = [
  {
    id: "1",
    name: "더단백 라떼 350ml",
    summary: "당류 21g — 감량 기준 초과",
    grade: "D",
  },
  {
    id: "2",
    name: "잇더핏 프로틴 190ml",
    summary: "단백질 20g — 감량 기준 충족",
    grade: "A",
  },
];

export default function ScanPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-32">
        <ScanStage results={RESULTS} />

        <p className="mt-4 text-[15px] text-muted-foreground">
          연속으로 찍으면 결과가 바로 바뀌어요
        </p>

        <div className="mt-4 flex gap-2.5">
          <div className="flex-1">
            <CtaButton tone="secondary" className="h-12">
              앨범에서 선택
            </CtaButton>
          </div>
          <div className="flex-1">
            <CtaButton tone="secondary" className="h-12">
              직접 입력
            </CtaButton>
          </div>
        </div>
      </div>

      <TabBar />
    </main>
  );
}
