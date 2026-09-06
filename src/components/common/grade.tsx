import { cn } from "@/lib/utils";

export const GRADES = ["A", "B", "C", "D", "E"] as const;

export type Grade = (typeof GRADES)[number];

const GRADE_BG: Record<Grade, string> = {
  A: "bg-grade-a",
  B: "bg-grade-b",
  C: "bg-grade-c",
  D: "bg-grade-d",
  E: "bg-grade-e",
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
