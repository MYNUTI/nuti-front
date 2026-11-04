import { cn } from "@/lib/utils";

/*
 * v3/ScoreRing — 점수 링(11-03).
 * 고리 길이 = 점수(0~100, 12시에서 시계 방향), 색 = 점수 구간 5개(1 잘 맞음 ~ 5 안 맞음), 숫자는 링 안.
 * 크기: L 60 결과 화면 · M 40 순위·목록·비교·더 맞는 제품 · S 32 검색 카드·스캔 시트.
 * 디자인 메모: 「보통」 같은 구간 이름은 링 옆에 쓰지 않는다(11-03 사용자 결정).
 * 점수 → 구간 경계는 디자인에 없어 구간은 넘겨받는다.
 */
export type ScoreBand = 1 | 2 | 3 | 4 | 5;

const SIZE = {
  L: { box: 60, stroke: 6, text: "text-[22px]" },
  M: { box: 40, stroke: 4, text: "text-[15px]" },
  S: { box: 32, stroke: 3.5, text: "text-[12px]" },
} as const;

const RING: Record<ScoreBand, string> = {
  1: "stroke-score-ring-1",
  2: "stroke-score-ring-2",
  3: "stroke-score-ring-3",
  4: "stroke-score-ring-4",
  5: "stroke-score-ring-5",
};

const NUMBER: Record<ScoreBand, string> = {
  1: "text-score-number-1",
  2: "text-score-number-2",
  3: "text-score-number-3",
  4: "text-score-number-4",
  5: "text-score-number-5",
};

export function ScoreRing({
  score,
  band,
  size = "M",
  className,
}: {
  /** 0~100 */
  score: number;
  band: ScoreBand;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const { box, stroke, text } = SIZE[size];
  const r = (box - stroke) / 2;
  const length = 2 * Math.PI * r;
  // 링·숫자·화면 읽기 글이 항상 같은 값을 보이게 0~100 정수로 맞춘다
  const shown = Number.isFinite(score)
    ? Math.round(Math.min(Math.max(score, 0), 100))
    : 0;
  const filled = (shown / 100) * length;

  return (
    <span
      role="img"
      aria-label={`${shown}점`}
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: box, height: box }}
    >
      <svg
        aria-hidden
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        fill="none"
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-score-track"
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${length}`}
          className={RING[band]}
        />
      </svg>
      <span
        aria-hidden
        // 글자 크기 클래스가 앞의 leading을 지우므로 leading-none을 뒤에 둔다
        className={cn("relative font-bold", text, "leading-none", NUMBER[band])}
      >
        {shown}
      </span>
    </span>
  );
}
