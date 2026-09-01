import type { Metadata } from "next";
import { CtaButton } from "@/components/common/cta-button";
import { IconCamera } from "@/components/icons";

export const metadata: Metadata = {
  title: "카메라 안내",
};

export default function CameraNoticePage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pb-6">
        <div className="flex flex-1 flex-col items-center justify-center">
          <span className="flex size-35 items-center justify-center rounded-4xl bg-muted">
            <IconCamera className="size-14" />
          </span>
          <h1 className="mt-8 text-center text-2xl leading-snug font-bold">
            바코드를 찍으면
            <br />
            등급을 바로 보여드려요
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            카메라는 스캔할 때만 써요
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <CtaButton>허용하기</CtaButton>
          <CtaButton variant="outline">나중에</CtaButton>
        </div>
      </div>
    </main>
  );
}
