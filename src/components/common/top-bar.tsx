import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/*
 * v2/TopBar — 상단 막대 52. 디자인 type과의 대응:
 *   back · close · back-action → title + left/right에 TopBarButton
 *   root → root(왼쪽 큰 제목)
 *   search → left + children(SearchField)
 * dark는 카메라 화면 위에 얹는 투명 막대다.
 * 기기 위쪽 safe area는 쓰는 화면이 정한다.
 */
export function TopBar({
  title,
  tone = "light",
  root = false,
  left,
  right,
  className,
  children,
  ...props
}: React.ComponentProps<"header"> & {
  title?: React.ReactNode;
  tone?: "light" | "dark";
  /** 탭 첫 화면처럼 제목을 왼쪽에 크게 둔다 */
  root?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const dark = tone === "dark";

  if (children) {
    return (
      <header
        data-tone={tone}
        className={cn(
          "group flex h-13 items-center gap-1 pr-5 pl-1",
          !dark && "bg-bg-page",
          className,
        )}
        {...props}
      >
        {left}
        <div className="min-w-0 flex-1">{children}</div>
      </header>
    );
  }

  return (
    <header
      data-tone={tone}
      className={cn(
        "group relative flex h-13 items-center",
        dark ? "text-white" : "bg-bg-page text-text-strong",
        className,
      )}
      {...props}
    >
      {title &&
        (root ? (
          <h1 className="absolute left-5 text-title1">{title}</h1>
        ) : (
          <h1 className="absolute left-1/2 w-60 -translate-x-1/2 truncate text-center text-body1-bold">
            {title}
          </h1>
        ))}
      {left && <div className="absolute left-1 flex">{left}</div>}
      {right && <div className="absolute right-1 flex -space-x-1">{right}</div>}
    </header>
  );
}

/** 상단 막대의 48px 아이콘 버튼. aria-label을 꼭 넣는다. asChild로 Link를 감싼다 */
export function TopBarButton({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      className={cn(
        "flex size-12 shrink-0 items-center justify-center text-icon-default group-data-[tone=dark]:text-white [&_svg]:size-6",
        className,
      )}
      {...props}
    />
  );
}
