import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";
import { GradeBadge } from "@/components/common/grade";
import type { ScanResult } from "@/lib/scan/types";

/**
 * 뷰파인더 하단에 겹쳐 띄운다. 호출자는 `relative` 컨테이너 안에 둬야 한다.
 *
 * 화면 하단에 고정하면 보조 입력 버튼을 덮어, 첫 결과 이후 앨범 선택·직접 입력을 누를
 * 수 없었다. 카메라 위에 두면 버튼은 늘 보이고 다음 바코드를 찍으면 시트만 바뀐다.
 */
function SheetFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="absolute inset-x-3 bottom-3 animate-in rounded-2xl border border-border bg-card p-3.5 shadow-lg slide-in-from-bottom-4"
    >
      {children}
    </div>
  );
}

export function ScanResultSheet({ result }: { result: ScanResult }) {
  return (
    <SheetFrame>
      <div className="flex items-center gap-3.5">
        <span className="size-12 shrink-0 rounded-xl bg-muted" />
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-bold">{result.name}</span>
          <span className="text-[13px] text-muted-foreground">
            {result.summary}
          </span>
        </span>
        <GradeBadge grade={result.grade} />
      </div>

      <CtaButton asChild className="mt-3 h-11">
        <Link href={`/product/${result.id}`}>자세히 보기</Link>
      </CtaButton>
    </SheetFrame>
  );
}

/** 결과 대신 조회 상태를 알린다. 결과 시트와 같은 자리를 써서 결과가 오면 그대로 교체된다. */
export function ScanMessageSheet({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <SheetFrame>
      <p className="text-[15px] font-bold">{title}</p>
      {description && (
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </SheetFrame>
  );
}
