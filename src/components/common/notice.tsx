import { IconInfo } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * v2/Notice — 안내 상자. 꼭 필요할 때만(한 화면 1개). 홈에는 고지·통계 문장을 넣지 않는다.
 * 옅은 회색 바탕 + info 아이콘 + 한 줄. 오른쪽 행동(글자 버튼 등)은 쓰는 쪽이 옆에 둔다.
 */
export function Notice({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 bg-bg-tint py-3 pr-1 pl-4",
        className,
      )}
    >
      <IconInfo
        aria-hidden
        className="mt-px size-[18px] shrink-0 text-icon-default"
      />
      <p className="min-w-0 flex-1 text-body2 text-text-body">{children}</p>
    </div>
  );
}
