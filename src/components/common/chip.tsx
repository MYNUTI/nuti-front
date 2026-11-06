import { cva } from "class-variance-authority";

import { IconChevronDown, IconClose } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * v2/Chip — 칩 36 · 알약. filter = 거르기 · dropdown = 고르는 시트를 연다 · removable = 적용된 조건(누르면 뺀다).
 * 고르지 않음 = 흰 면 + 테두리, 고름 = 테두리 없이 옅은 면 + link 글자(세 종류 모두 같음).
 * 원본 설명은 「선택 = 초록 테두리」지만 컴포넌트 그림과 v3 화면은 테두리가 없어 그쪽을 따른다.
 */
const chipVariants = cva(
  "inline-flex h-9 shrink-0 items-center rounded-full whitespace-nowrap",
  {
    variants: {
      kind: {
        filter: "px-3.5",
        dropdown: "gap-1 pr-2.5 pl-3.5 [&_svg]:size-4",
        removable: "gap-1 pr-2.5 pl-3.5 [&_svg]:size-4",
      },
      selected: {
        true: "bg-brand-primary-weak text-body2-bold text-brand-link",
        false:
          "border border-line-strong bg-bg-page text-body2-medium text-text-strong [&_svg]:text-icon-default",
      },
    },
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
