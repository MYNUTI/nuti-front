import { cva, type VariantProps } from "class-variance-authority";

import { GRADES, type Grade } from "@/lib/grade";
import { cn } from "@/lib/utils";

export { GRADES, type Grade };

/** 등급 기준 화면과 같은 말. v3 「유지한 결정」의 등급 이름 */
export const GRADE_LABEL: Record<Grade, string> = {
  A: "잘 맞음",
  B: "맞는 편",
  C: "보통",
  D: "안 맞는 편",
  E: "안 맞음",
};

const GRADE_BG: Record<Grade, string> = {
  A: "bg-grade-a",
  B: "bg-grade-b",
  C: "bg-grade-c",
  D: "bg-grade-d",
  E: "bg-grade-e",
};

const badgeVariants = cva(
  "flex shrink-0 items-center justify-center text-grade-on",
  {
    variants: {
      size: {
        S: "size-6 rounded-[6px] text-body2-bold",
        M: "size-8 rounded-sm text-body1-bold",
        L: "size-14 rounded-[14px] text-display",
      },
    },
    defaultVariants: { size: "M" },
  },
);

/** v2/GradeBadge. S 24(작은 자리) · M 32(목록 오른쪽) · L 56(결과 화면). 색만으로 구분하지 않게 글자를 같이 쓴다 */
export function GradeBadge({
  grade,
  size,
  className,
}: { grade: Grade; className?: string } & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ size }), GRADE_BG[grade], className)}>
      {grade}
    </span>
  );
}

/** v2/GradeTag. M 배지 + 등급 이름 */
export function GradeTag({
  grade,
  className,
}: {
  grade: Grade;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <GradeBadge grade={grade} />
      <span className="text-body1-bold text-text-strong">
        {GRADE_LABEL[grade]}
      </span>
    </span>
  );
}

/** 임시 화면 전용. v3 부품이 아니고, 마지막 사용처가 바뀌면 지운다(UI 플랜 13단계) */
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
