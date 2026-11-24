import Link from "next/link";

import { cn } from "@/lib/utils";

/*
 * v2/CategoryTile — 종류 입구. 원형 그림 64 + 이름 12(그림만 쓰지 않는다). 홈(size="S", 【최종】)은 둥근 네모 56(모서리 12) + 이름 12 Medium.
 * 고른 종류는 그림에 초록 테두리 + 굵은 초록 글자. 4~5열 격자로 놓는다.
 * 디자인 메모: 긴 이름은 가운뎃점에서 줄을 나눈다(「스낵·빵·\n디저트」) — 줄바꿈은 넘기는 이름에 넣는다.
 * href를 넘기면 이동 링크(홈), 아니면 고르는 버튼(랭킹 종류 줄)이다.
 */
type Props = {
  label: React.ReactNode;
  /** 원 안을 채울 그림 */
  image?: React.ReactNode;
  selected?: boolean;
  size?: "M" | "S";
  className?: string;
};

export function CategoryTile({
  label,
  image,
  selected = false,
  size = "M",
  className,
  href,
  ...props
}: Props &
  (
    | ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href">)
    | ({ href?: undefined } & React.ComponentProps<"button">)
  )) {
  const content = (
    <>
      <span
        className={cn(
          "aspect-square overflow-hidden *:size-full *:object-cover",
          size === "S"
            ? // 【최종】 홈: 칸 74에 그림 56(75.7%). 좁은 화면에서도 이 비율로 줄어 그림 사이 틈이 남는다
              "w-[75.7%] max-w-14 rounded-md"
            : // 디자인 칸 72.4px에 원 64px(88.4%)
              "w-[88.4%] max-w-16 rounded-full",
          selected && "border-[1.5px] border-brand-link",
        )}
      >
        {image}
      </span>
      <span
        className={cn(
          "w-full text-center whitespace-pre-line",
          // 글자 크기를 덮어쓰면 cn이 캡션 스타일의 굵기까지 지우므로 크기별로 따로 적는다
          selected ? "text-caption-bold" : "text-caption",
          selected
            ? "text-brand-link"
            : size === "S"
              ? "text-text-strong"
              : "text-text-body",
        )}
      >
        {label}
      </span>
    </>
  );
  const tileClass = cn("flex w-20 flex-col items-center gap-1.5", className);

  if (href !== undefined) {
    return (
      <Link
        href={href}
        className={tileClass}
        {...(props as Omit<React.ComponentProps<typeof Link>, "href">)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={tileClass}
      {...(props as React.ComponentProps<"button">)}
    >
      {content}
    </button>
  );
}
