import type { Metadata } from "next";
import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";
import { IconCamera } from "@/components/icons";

export const metadata: Metadata = {
  title: "카메라 안내",
};

export default function CameraNoticePage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <div className="flex aspect-3/2 w-full items-center justify-center rounded-3xl bg-muted">
          <IconCamera className="size-14 text-muted-foreground" />
        </div>

        <h1 className="mt-6 text-2xl leading-snug font-bold">
          바코드를 찍으면
          <br />
          등급을 바로 보여드려요
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          카메라는 스캔할 때만 써요.
        </p>

        <div className="mt-auto flex flex-col gap-2.5 pt-10">
          <CtaButton asChild>
            <Link href="/onboarding/scan">허용하기</Link>
          </CtaButton>
          <CtaButton asChild tone="outline">
            <Link href="/onboarding/scan">나중에</Link>
          </CtaButton>
        </div>
      </div>
    </main>
  );
}
