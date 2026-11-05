import { cn } from "@/lib/utils";

/*
 * v2/Toggle — 48×28. 끔 = line/strong 바탕, 켬 = brand/primary(라임) 바탕, 손잡이는 흰 원.
 * 실제 checkbox(role="switch")를 숨겨 두고 겉모양만 그린다. 나머지 props는 input으로 간다.
 */
export function Toggle({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "role">) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        {...props}
      />
      <span
        aria-hidden
        className="h-7 w-12 rounded-full bg-line-strong transition-colors peer-checked:bg-brand-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-text-strong"
      />
      <span
        aria-hidden
        className="absolute top-[3px] left-[3px] size-[22px] rounded-full bg-white transition-transform peer-checked:translate-x-5"
      />
    </span>
  );
}
