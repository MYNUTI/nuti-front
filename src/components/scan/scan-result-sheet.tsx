/**
 * 조회 실패 안내. 뷰파인더 하단에 겹쳐 띄우며 호출자는 `relative` 컨테이너 안에 둬야 한다.
 * 찾은 제품은 시트 없이 3-2로, 미등록은 3-6 시트로 간다(【최종】 3-1 · 3-6). 조회 실패는 【최종】에 그림이 없어
 * 예전 틀을 v3 토큰으로만 맞췄다(13단계)
 */
function SheetFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="absolute inset-x-3 bottom-3 animate-in rounded-lg border border-line-default bg-bg-page p-3.5 shadow-lg slide-in-from-bottom-4"
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
      <p className="text-body1-bold text-text-strong">{title}</p>
      {description && (
        <p className="mt-0.5 text-body2 text-text-sub">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </SheetFrame>
  );
}
