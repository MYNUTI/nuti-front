import { cva } from "class-variance-authority";

import { IconChevronDown, IconClose } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 피그마 v2/Chip — 칩 36 · 알약. filter = 거르기 · dropdown = 고르는 시트를 연다 · removable = 적용된 조건(누르면 뺀다).
 * 원본 컴포넌트의 filter 선택은 초록 테두리가 있지만, v3 화면(CHIPS 모드)에서는 테두리 없이 옅은 면 + link 글자로 쓰여 그쪽을 따른다.
 */
const chipVariants = cva(
  "inline-flex h-9 shrink-0 items-center rounded-full whitespace-nowrap",
  {
    variants: {
      kind: {
        filter: "px-3.5",
        dropdown: "gap-1 border pr-2.5 pl-3.5 [&_svg]:size-4",
        removable: "gap-1 border pr-2.5 pl-3.5 [&_svg]:size-4",
      },
      selected: {
        true: "bg-brand-primary-weak text-body2-bold text-brand-link",
        false: "text-body2-medium text-text-strong [&_svg]:text-icon-default",
      },
    },
    compoundVariants: [
      {
        kind: ["dropdown", "removable"],
        selected: false,
        className: "border-line-strong bg-bg-page",
      },
      {
        kind: ["dropdown", "removable"],
        selected: true,
        className: "border-brand-link",
      },
    ],
    defaultVariants: { kind: "filter", selected: false },
  },
);

export function Chip({
  kind = "filter",
  selected = false,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  kind?: "filter" | "dropdown" | "removable";
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={kind === "filter" ? selected : undefined}
      className={cn(chipVariants({ kind, selected }), className)}
      {...props}
    >
      {children}
      {kind === "dropdown" && <IconChevronDown />}
      {kind === "removable" && (
        <>
          <span className="sr-only"> 빼기</span>
          <IconClose aria-hidden />
        </>
      )}
    </button>
  );
}
