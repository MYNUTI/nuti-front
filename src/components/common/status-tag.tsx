import { cn } from "@/lib/utils";

/*
 * 피그마 v2/StatusTag — 요청·제보 상태 알약.
 * 색은 피그마 변수가 아니라 컴포넌트에 직접 넣은 값이라 토큰 없이 그대로 옮겼다(글자 대비 4.5 이상).
 */
const STATUS = {
  analyzing: { label: "분석 중", className: "bg-[#fff1c7] text-[#6b4e00]" },
  checking: { label: "확인 중", className: "bg-[#e3eefb] text-[#1b4f8a]" },
  before: { label: "분석 전", className: "bg-[#f2f4f3] text-text-sub" },
  done: { label: "등급 나옴", className: "bg-[#e7f2ee] text-[#17624f]" },
} as const;

export type Status = keyof typeof STATUS;

export function StatusTag({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-[6px] px-2 py-[3px] text-caption-bold",
        STATUS[status].className,
        className,
      )}
    >
      {STATUS[status].label}
    </span>
  );
}
