import { IconMinusCircle, IconPlusCircle } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 피그마 v2/ReasonRow — 좋은 점(+ 초록) / 걸리는 점(− 핫핑크).
 * 색만이 아니라 + / − 모양으로도 구분한다(WCAG 1.4.1). 아이콘 뜻은 화면 읽기용 글자로 같이 알린다.
 */
export function ReasonRow({
  kind,
  className,
  children,
}: {
  kind: "good" | "bad";
  className?: string;
  children: React.ReactNode;
}) {
  const good = kind === "good";
  const Icon = good ? IconPlusCircle : IconMinusCircle;

  return (
    <div className={cn("flex items-start gap-2.5 px-5 py-2", className)}>
      <Icon
        aria-hidden
        className={cn(
          "size-5 shrink-0",
          good ? "text-icon-good" : "text-icon-bad",
        )}
      />
      <p className="flex-1 text-body1 text-text-strong">
        <span className="sr-only">{good ? "좋은 점: " : "걸리는 점: "}</span>
        {children}
      </p>
    </div>
  );
}
