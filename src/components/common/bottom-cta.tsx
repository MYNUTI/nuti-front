import { cn } from "@/lib/utils";

/*
 * 피그마 v2/BottomCTA — 흐름 화면 하단 주 버튼 띠. 주 버튼은 화면에 하나.
 * 피그마 type과의 대응:
 *   single · double · icon-single → children(버튼 줄)만, icon-single은 note도
 *   note-single → note + 버튼 하나
 *   filter → chips + 버튼 줄
 *   stack → 버튼 하나 + textAction
 * 피그마의 홈 인디케이터 34px 자리는 기기 safe area로 대신한다.
 * 화면에 고정하는 위치(fixed·sticky)는 쓰는 화면이 정한다.
 */
export function BottomCta({
  note,
  chips,
  textAction,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** 버튼 줄 바로 위 고지 한 줄(쿠팡 파트너스 문구 등) */
  note?: React.ReactNode;
  /** 버튼 줄 위의 고른 조건 칩(filter) */
  chips?: React.ReactNode;
  /** 버튼 줄 아래 글자 버튼(stack) */
  textAction?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col bg-bg-page px-5 pt-3 pb-[max(var(--safe-bottom),12px)]",
        chips
          ? "gap-3 border-t border-line-default"
          : textAction
            ? "gap-1"
            : "gap-2.5",
        className,
      )}
      {...props}
    >
      {note && <p className="text-center text-caption text-text-sub">{note}</p>}
      {chips && <div className="flex gap-2 overflow-x-auto">{chips}</div>}
      <div className="flex gap-2">{children}</div>
      {textAction}
    </div>
  );
}
