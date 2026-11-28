import { cn } from "@/lib/utils";

/*
 * v3/ReasonChip — 3-2 「이 점수인 이유」의 좋은 점(연두) · 아쉬운 점(분홍).
 * 칩 줄(가로 · 줄바꿈 · 간격 8)에 이어 붙인다. 칩 글은 짧게, 숫자는 영양성분 표로(11-02 회의 · 11-03 결정).
 * 바탕색은 디자인 변수가 아니라 컴포넌트에 직접 넣은 값이다. 디자인 메모(11-09)로 +/− 아이콘을 뺐다.
 * 색으로만 나뉘지 않게 칩 줄 위 「좋은 점」 · 「아쉬운 점」 머리가 묶음을 알린다.
 */
export function ReasonChip({
  kind,
  children,
}: {
  kind: "good" | "bad";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-3 py-1.5 text-body2 text-text-strong",
        kind === "good" ? "bg-[#edfae0]" : "bg-[#ffeded]",
      )}
    >
      {children}
    </span>
  );
}
