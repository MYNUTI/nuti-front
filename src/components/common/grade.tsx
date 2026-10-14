import { GRADES, type Grade } from "@/lib/grade";
import { cn } from "@/lib/utils";

export { GRADES, type Grade };

const GRADE_BG: Record<Grade, string> = {
  A: "bg-bg-a-default",
  B: "bg-bg-b-default",
  C: "bg-bg-c-default",
  D: "bg-bg-d-default",
  E: "bg-bg-e-default",
};

export function GradeBadge({
  grade,
  className,
}: {
  grade: Grade;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white",
        GRADE_BG[grade],
        className,
      )}
    >
      {grade}
    </span>
  );
}

export function GradeBar({
  grade,
  className,
}: {
  grade: Grade;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1", className)} aria-hidden>
      {GRADES.map((step) => (
        <span
          key={step}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            step === grade ? GRADE_BG[step] : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}
