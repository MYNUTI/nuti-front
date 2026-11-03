import Link from "next/link";

import { IconChevronRight } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 피그마 v2/SectionHeader — 구역 제목 18 + 기준 한 줄(누구·무엇 기준·모수) + 「전체 보기」.
 * 피그마 메모: 주어 없는 형용사 제목은 쓰지 않는다.
 */
export function SectionHeader({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 오른쪽 링크 글자(예: 「전체 15」). actionHref와 같이 넘긴다 */
  actionLabel?: React.ReactNode;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5 px-5 pt-6 pb-2", className)}>
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 text-title2 text-text-strong">{title}</h2>
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="flex shrink-0 items-center text-body2-medium text-text-sub"
          >
            {actionLabel}
            <IconChevronRight className="size-4 text-icon-sub" />
          </Link>
        )}
      </div>
      {description && <p className="text-body2 text-text-sub">{description}</p>}
    </div>
  );
}
