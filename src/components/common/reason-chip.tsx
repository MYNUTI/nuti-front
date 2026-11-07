import { IconMinusCircle, IconPlusCircle } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * v3/ReasonChip — 3-2 「이 점수인 이유」의 좋은 점(연두 · ⊕) · 아쉬운 점(분홍 · ⊖).
 * 칩 줄(가로 · 줄바꿈 · 간격 8)에 이어 붙인다. 칩 글은 짧게, 숫자는 영양성분 표로(11-02 회의 · 11-03 결정).
 * 바탕색은 디자인 변수가 아니라 컴포넌트에 직접 넣은 값이다. 색만이 아니라 ⊕ ⊖ 모양으로도 구분한다.
 */
export function ReasonChip({
  kind,
  children,
}: {
  kind: "good" | "bad";
  children: React.ReactNode;
}) {
  const good = kind === "good";
  const Icon = good ? IconPlusCircle : IconMinusCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl py-1.5 pr-3 pl-2.5 text-body2 text-text-strong",
        good ? "bg-[#edfae0]" : "bg-[#ffeded]",
      )}
    >
      <Icon
        aria-hidden
        className={cn("size-4", good ? "text-icon-good" : "text-icon-bad")}
      />
      {children}
    </span>
  );
}
