import { cn } from "@/lib/utils";

/*
 * 피그마 컴포넌트 v2/CategoryTile — 종류 입구. 원형 그림 64 + 이름 12(그림만 쓰지 않는다).
 * 고른 종류는 그림에 초록 테두리 + 굵은 초록 글자. 4~5열 격자로 놓는다.
 * 피그마 메모: 긴 이름은 가운뎃점에서 줄을 나눈다(「스낵·빵·\n디저트」) — 줄바꿈은 넘기는 이름에 넣는다.
 */
export function CategoryTile({
  label,
  image,
  selected = false,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  label: React.ReactNode;
  /** 원 안을 채울 그림 */
  image?: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn("flex w-20 flex-col items-center gap-1.5", className)}
      {...props}
    >
      <span
        className={cn(
          "size-16 overflow-hidden rounded-full *:size-full *:object-cover",
          selected && "border-[1.5px] border-brand-link",
        )}
      >
        {image}
      </span>
      <span
        className={cn(
          "w-full text-center whitespace-pre-line",
          selected
            ? "text-caption-bold text-brand-link"
            : "text-caption text-text-body",
        )}
      >
        {label}
      </span>
    </button>
  );
}
