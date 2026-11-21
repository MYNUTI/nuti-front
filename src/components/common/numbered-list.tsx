/*
 * v2/NumberedRow — 번호 + 제목 + 설명(등급 기준 · 약관 · 처리방침 목차).
 * 번호는 옅은 초록 알약 + 초록 글자. 한 문장짜리 단계 안내는 StepList를 쓴다.
 */
export function NumberedList({
  items,
}: {
  items: readonly { title: React.ReactNode; description?: React.ReactNode }[];
}) {
  return (
    <ol>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 px-5 py-3.5">
          <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary-weak px-1.5 text-caption-bold text-brand-link">
            {i + 1}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body1-bold text-text-strong">
              {item.title}
            </span>
            {item.description && (
              <span className="text-body2 text-text-sub">
                {item.description}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
