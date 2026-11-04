import { cn } from "@/lib/utils";

/* v2/StepDots — 지금 단계만 길게 + 진한 색(v3에서는 brand/on-lime) */
export function StepDots({
  count,
  current,
  className,
}: {
  count: number;
  /** 0부터 센다 */
  current: number;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${count}단계 중 ${current + 1}단계`}
      className={cn("flex items-center gap-1.5", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-[3px]",
            i === current
              ? "w-[18px] bg-brand-on-lime"
              : "w-1.5 bg-line-strong",
          )}
        />
      ))}
    </div>
  );
}
