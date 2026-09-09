import type { Metadata } from "next";
import { CtaButton } from "@/components/common/cta-button";
import { TabBar } from "@/components/common/tab-bar";
import { IconCamera } from "@/components/icons";

export const metadata: Metadata = {
  title: "스캔",
};

export default function ScanPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-32">
        <div className="flex aspect-7/8 w-full items-center justify-center rounded-3xl bg-muted">
          <IconCamera className="size-14 text-muted-foreground" />
        </div>

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
