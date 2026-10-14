import { cn } from "@/lib/utils";

/** 화면을 덮는 딤. dimmed-strong은 튜토리얼용 */
export function Layer({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "dimmed-strong" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "fixed-app inset-y-0",
        variant === "dimmed-strong" ? "bg-black-alpha-80" : "bg-black-alpha-50",
        className,
      )}
      {...props}
    />
  );
}
