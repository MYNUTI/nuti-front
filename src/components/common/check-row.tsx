import Link from "next/link";

import { CheckboxMark } from "@/components/common/check-mark";
import { IconChevronRight } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 피그마 v2/CheckRow — 체크 + 이름 + 「보기 ›」(약관·동의).
 * 피그마 메모: 필수/선택은 머리 글로 나누고, 미리 체크해 두지 않는다.
 */
export function CheckRow({
  label,
  detailHref,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  label: React.ReactNode;
  /** 「보기 ›」를 눌렀을 때 갈 곳(약관 화면 등) */
  detailHref?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-5 py-3", className)}>
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <input type="checkbox" className="peer sr-only" {...props} />
        <CheckboxMark className="peer-focus-visible:rounded-[6px] peer-focus-visible:outline-2 peer-focus-visible:outline-text-strong" />
        <span className="flex-1 text-body1 text-text-body">{label}</span>
      </label>
      {detailHref && (
        <Link
          href={detailHref}
          className="flex shrink-0 items-center text-body2-medium text-text-sub"
        >
          보기
          <IconChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
