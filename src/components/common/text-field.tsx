import { useId } from "react";

import { cn } from "@/lib/utils";

/*
 * 피그마 v2/TextField — 입력칸 52 · 회색 면 · 모서리 12.
 * 초점 = 흰 면 + 초록 테두리 · error = 빨간 테두리 + 칸 바로 아래 문장 · warn = 핫핑크 테두리 + 문장.
 * 초점 테두리는 원본이 brand/primary(v3에서는 라임)인데, v3 화면의 다른 「초록 테두리」(칩·선택 카드)처럼 link 색을 쓴다.
 */
export function TextField({
  label,
  message,
  status,
  id,
  className,
  ...props
}: React.ComponentProps<"input"> & {
  label: React.ReactNode;
  /** 칸 아래 한 줄. status가 없으면 도움말, 있으면 오류·주의 문장 */
  message?: React.ReactNode;
  status?: "error" | "warn";
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const messageId = `${inputId}-message`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className="text-body2-medium text-text-body">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={status === "error" || undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          "h-13 w-full rounded-md border-[1.5px] border-transparent bg-bg-field px-4 text-body1 text-text-strong outline-none placeholder:text-text-hint",
          "focus:border-brand-link focus:bg-bg-page",
          status === "error" &&
            "border-text-danger bg-bg-page focus:border-text-danger",
          status === "warn" &&
            "border-icon-bad bg-bg-page focus:border-icon-bad",
        )}
        {...props}
      />
      {message && (
        <p
          id={messageId}
          className={cn(
            "text-body2",
            status === "error"
              ? "text-text-danger"
              : status === "warn"
                ? "text-icon-bad"
                : "text-text-sub",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
