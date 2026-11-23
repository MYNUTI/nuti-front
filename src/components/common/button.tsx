import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/*
 * v2/Button. 【최종】 primary는 검정(brand/button) 면 + 흰 글자, 온보딩 5장(0-3 · 0-3x · 0-4 · 0-4b · 1-5)만
 * lime(brand/button-lime) 면 + 짙은 글자. 옅은 면 · 글자 버튼의 글자는 link 색.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md whitespace-nowrap select-none disabled:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      kind: {
        primary:
          "bg-brand-button text-text-on-primary disabled:bg-line-default disabled:text-text-disabled",
        lime: "bg-brand-button-lime text-brand-on-lime disabled:bg-line-default disabled:text-text-disabled",
        secondary:
          "bg-brand-primary-weak text-brand-link disabled:bg-line-default disabled:text-text-disabled",
        tertiary:
          "border border-line-strong bg-bg-page text-text-strong disabled:border-transparent disabled:bg-line-default disabled:text-text-disabled",
        text: "text-brand-link disabled:text-text-disabled",
        dark: "bg-white/16 text-white",
        danger: "bg-text-danger text-text-on-primary",
      },
      size: {
        L: "h-13 px-5 text-body1-bold [&_svg]:size-6",
        M: "h-11 px-4 text-body2-bold [&_svg]:size-5",
        S: "h-9 px-3 text-body2-medium [&_svg]:size-5",
      },
    },
    defaultVariants: {
      kind: "primary",
      size: "L",
    },
  },
);

/** 아이콘은 글자 앞에 자식으로 넣는다. asChild로 Link를 감싸 링크로도 쓴다 */
export function Button({
  kind,
  size,
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      className={cn(buttonVariants({ kind, size }), className)}
      {...props}
    />
  );
}
