import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";
import { GradeBadge, type Grade } from "@/components/common/grade";

/** 등급은 서버에서 내려받은 값만 쓴다 — 클라이언트에서 계산하지 않는다. */
export type ScanResult = {
  id: string;
  name: string;
  summary: string;
  grade: Grade;
};

export function ScanResultSheet({ result }: { result: ScanResult }) {
  return (
    <div className="fixed-app bottom-0 px-5 pb-32">
      <div className="animate-in rounded-3xl border border-border bg-card p-4 shadow-lg slide-in-from-bottom-4">
        <div className="flex items-center gap-3.5">
          <span className="size-14 shrink-0 rounded-xl bg-muted" />
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-bold">{result.name}</span>
            <span className="text-[13px] text-muted-foreground">
              {result.summary}
            </span>
          </span>
          <GradeBadge grade={result.grade} />
        </div>

        <CtaButton asChild className="mt-4">
          <Link href={`/product/${result.id}`}>자세히 보기</Link>
        </CtaButton>
      </div>
    </div>
  );
}
