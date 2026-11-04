import { CheckboxMark, RadioMark } from "@/components/common/check-mark";
import { cn } from "@/lib/utils";

/*
 * v2/SelectCard — 회색 면, 고르면 옅은 초록 면 + 초록 테두리(색과 표시 두 가지로 알린다).
 * variant="soft"는 11-04 회의를 반영한 1-5 목표 선택의 모양으로, 고르면 테두리 없이 연한 라임 면 + 라임 동그라미다.
 * 디자인 시스템 판에 아직 반영되지 않아 기본 모양은 그대로 둔다.
 * 실제 input(radio·checkbox)을 감싸서 키보드·화면 읽기가 그대로 동작한다. 나머지 props는 input으로 간다.
 */
export function SelectCard({
  control = "radio",
  title,
  description,
  image,
  imageSize = "M",
  variant = "default",
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "title"> & {
  control?: "radio" | "check";
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 오른쪽 그림 자리 */
  image?: React.ReactNode;
  /** M 44(기본) · L 80(1-5 목표 선택) */
  imageSize?: "M" | "L";
  variant?: "default" | "soft";
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3.5 rounded-lg border-[1.5px] border-transparent bg-bg-field p-[18px]",
        "has-checked:bg-brand-primary-weak has-focus-visible:outline-2 has-focus-visible:outline-text-strong",
        variant === "default" && "has-checked:border-brand-link",
        className,
      )}
    >
      <input
        type={control === "radio" ? "radio" : "checkbox"}
        className="peer sr-only"
        {...props}
      />
      {control === "radio" ? <RadioMark tone={variant} /> : <CheckboxMark />}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-body1-bold text-text-strong">{title}</span>
        {description && (
          <span className="text-body2 text-text-sub">{description}</span>
        )}
      </span>
      {image && (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden bg-bg-page *:size-full",
            // 디자인: 44px 그림은 칸 안에 맞추고, 1-5의 80px 그림은 칸을 꽉 채운다
            imageSize === "L"
              ? "size-20 rounded-[18px] *:object-cover"
              : "size-11 rounded-md *:object-contain",
          )}
        >
          {image}
        </span>
      )}
    </label>
  );
}
