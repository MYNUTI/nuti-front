/**
 * 조회 실패·미등록 안내용(예전 모양). 뷰파인더 하단에 겹쳐 띄우며 호출자는 `relative` 컨테이너 안에 둬야 한다.
 * 찾은 제품은 시트 없이 3-2로 바로 간다(【최종】 3-1 메모). 미등록은 3-6 시트를 만들 때(08단계 다음 순서) 바꾼다.
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

/** 조회 상태를 알린다(불러오지 못했을 때 · 미등록) */
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
