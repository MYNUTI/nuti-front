import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-2xl leading-snug font-bold">
            찾을 수 없는
            <br />
            페이지예요
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            주소가 바뀌었거나 삭제된 제품일 수 있어요.
          </p>
        </div>

        <CtaButton asChild>
          <Link href="/home">홈으로</Link>
        </CtaButton>
      </div>
    </main>
  );
}
