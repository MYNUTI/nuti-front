import { CheckboxMark, RadioMark } from "@/components/common/check-mark";
import { cn } from "@/lib/utils";

/*
 * 피그마 v2/SelectCard — 회색 면, 고르면 옅은 초록 면 + 초록 테두리(색과 표시 두 가지로 알린다).
 * 실제 input(radio·checkbox)을 감싸서 키보드·화면 읽기가 그대로 동작한다. 나머지 props는 input으로 간다.
 */
export function SelectCard({
  control = "radio",
  title,
  description,
  image,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "title"> & {
  control?: "radio" | "check";
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 오른쪽 44px 그림 자리 */
  image?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3.5 rounded-lg border-[1.5px] border-transparent bg-bg-field p-[18px]",
        "has-checked:border-brand-link has-checked:bg-brand-primary-weak has-focus-visible:outline-2 has-focus-visible:outline-text-strong",
        className,
      )}
    >
      <input
        type={control === "radio" ? "radio" : "checkbox"}
        className="peer sr-only"
        {...props}
      />
      {control === "radio" ? <RadioMark /> : <CheckboxMark />}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body1-bold text-text-strong">{title}</span>
        {description && (
          <span className="text-body2 text-text-sub">{description}</span>
        )}
      </span>
      {image && (
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-page">
          {image}
        </span>
      )}
    </label>
  );
}
