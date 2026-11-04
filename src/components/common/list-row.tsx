import Link from "next/link";

import { Toggle } from "@/components/common/toggle";
import { IconChevronRight } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * v2/ListRow — 설정·메뉴 한 줄(최소 56). 디자인 trailing과의 대응:
 *   chevron → href · value → value · toggle → toggle · none → 아무것도 넘기지 않음
 */
export function ListRow({
  title,
  description,
  href,
  value,
  toggle,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 넘기면 줄 전체가 링크가 되고 오른쪽에 › 가 붙는다 */
  href?: string;
  /** 오른쪽 값 글자 */
  value?: React.ReactNode;
  /** 넘기면 오른쪽에 토글이 붙고 줄 전체가 그 라벨이 된다. props는 input으로 간다 */
  toggle?: Omit<React.ComponentProps<"input">, "type" | "role">;
  className?: string;
}) {
  const rowClass = "flex items-center gap-3 bg-bg-page px-5 py-4";
  const text = (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-body1 text-text-strong">{title}</span>
      {description && (
        <span className="text-body2 text-text-sub">{description}</span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={cn(rowClass, className)}>
        {text}
        <IconChevronRight className="size-5 shrink-0 text-icon-sub" />
      </Link>
    );
  }

  if (toggle) {
    return (
      <label className={cn(rowClass, "cursor-pointer", className)}>
        {text}
        <Toggle {...toggle} />
      </label>
    );
  }

  return (
    <div className={cn(rowClass, className)}>
      {text}
      {value !== undefined && (
        <span className="shrink-0 text-body1-medium text-text-sub">
          {value}
        </span>
      )}
    </div>
  );
}
