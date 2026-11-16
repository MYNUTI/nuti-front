import { cn } from "@/lib/utils";

/*
 * v2/Toggle — 48×28. 끔 = line/strong 바탕 + 흰 손잡이, 켬 = brand/primary(라임) 바탕 + bg/dark 손잡이.
 * 켬 손잡이는 피그마 【최종】 화면 기준이다(5-5b 동의 관리 · 5-11 이용 통계 — 2026-11-16 디자인 확정). 부품 원본은
 * 옛 흰색으로 남아 있다. 라임 위 흰색은 대비 1.45:1 로 화면 요소 기준(3:1)에 못 미쳐 검정(12.59:1)으로 둔다.
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
        className="absolute top-[3px] left-[3px] size-[22px] rounded-full bg-white transition-transform peer-checked:translate-x-5 peer-checked:bg-bg-dark"
      />
    </span>
  );
}
