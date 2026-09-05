import type { Metadata } from "next";
import { CtaButton } from "@/components/common/cta-button";
import { IconCamera } from "@/components/icons";

export const metadata: Metadata = {
  title: "바코드 스캔",
};

export default function OnboardingScanPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <div className="flex aspect-5/6 w-full items-center justify-center rounded-3xl bg-muted">
          <IconCamera className="size-14 text-muted-foreground" />
        </div>

        <p className="mt-5 text-[15px] font-bold">
          셔터 없이 자동으로 인식돼요
        </p>

        <div className="mt-auto pt-10">
          <CtaButton tone="secondary">직접 검색으로 찾기</CtaButton>
        </div>
      </div>
    </main>
  );
}
