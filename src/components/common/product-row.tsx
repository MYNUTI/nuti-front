import Link from "next/link";

import { CheckboxMark } from "@/components/common/check-mark";
import { GradeBadge, type Grade } from "@/components/common/grade";
import { Thumb } from "@/components/common/thumb";
import { cn } from "@/lib/utils";

/*
 * 피그마 v2/ProductRow — [순위] 사진 64 · 브랜드 / 이름(2줄까지) / 메타 · 등급 배지 M.
 * 행 사이는 선 없이 여백으로 나눈다. 피그마 trailing과의 대응:
 *   badge → grade · button → grade + action · select → select(비교할 제품 고르기)
 */
export function ProductRow({
  brand,
  name,
  meta,
  grade,
  image,
  rank,
  href,
  action,
  select,
  className,
}: {
  brand?: React.ReactNode;
  name: React.ReactNode;
  meta?: React.ReactNode;
  grade?: Grade;
  /** Thumb 안에 넣을 사진 */
  image?: React.ReactNode;
  rank?: number;
  /** 줄을 누르면 갈 곳(제품 결과 등). action은 이 링크 밖에 둔다 */
  href?: string;
  /** 오른쪽 끝 버튼(담기 등) */
  action?: React.ReactNode;
  /** 넘기면 줄 전체가 체크박스가 된다. props는 input으로 간다 */
  select?: Omit<React.ComponentProps<"input">, "type">;
  className?: string;
}) {
  const body = (
    <>
      {rank !== undefined && (
        <span className="w-5 shrink-0 text-center text-body1-bold text-text-strong">
          {rank}
        </span>
      )}
      {select && (
        <>
          <input type="checkbox" className="peer sr-only" {...select} />
          <CheckboxMark className="peer-focus-visible:rounded-[6px] peer-focus-visible:outline-2 peer-focus-visible:outline-text-strong" />
        </>
      )}
      <Thumb>{image}</Thumb>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {brand && <span className="text-body2 text-text-sub">{brand}</span>}
        <span className="line-clamp-2 text-body1-medium text-text-strong">
          {name}
        </span>
        {meta && <span className="text-body2 text-text-sub">{meta}</span>}
      </span>
      {grade && <GradeBadge grade={grade} />}
    </>
  );

  const rowClass = "flex items-center gap-3 bg-bg-page px-5 py-3";

  if (select) {
    return (
      <label className={cn(rowClass, "cursor-pointer", className)}>
        {body}
      </label>
    );
  }

  if (href) {
    return (
      <div className={cn(rowClass, className)}>
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
          {body}
        </Link>
        {action}
      </div>
    );
  }

  return (
    <div className={cn(rowClass, className)}>
      {body}
      {action}
    </div>
  );
}
