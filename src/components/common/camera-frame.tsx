import { cn } from "@/lib/utils";

/*
 * 피그마 컴포넌트 v2/CameraFrame — 카메라 화면 자리. 어두운 바탕 + 가운데 조준 틀 + 흰 모서리 4개.
 * 조준 틀은 바코드 280×160, 성분표 320×420. 위에는 TopBar tone=dark, 아래에는 안내 문장·dark 버튼을 놓는다.
 * 색은 피그마 변수가 아니라 컴포넌트에 직접 넣은 값이다.
 * 실제 카메라 영상을 어떻게 겹칠지는 스캔 화면(03단계)에서 정한다.
 */
const WINDOW = {
  barcode: "h-40 w-70",
  label: "h-105 w-80",
} as const;

const CORNERS = [
  "top-0 left-0",
  "top-0 right-0 rotate-90",
  "right-0 bottom-0 rotate-180",
  "bottom-0 left-0 -rotate-90",
];

export function CameraFrame({
  shape = "barcode",
  className,
}: {
  shape?: keyof typeof WINDOW;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-[#2b3034]",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "relative shrink-0 rounded-lg bg-[#454b50]",
          WINDOW[shape],
        )}
      >
        {CORNERS.map((position) => (
          <svg
            key={position}
            width={28}
            height={28}
            viewBox="0 0 28 28"
            fill="none"
            className={cn("absolute", position)}
          >
            <path
              d="M2 28V10C2 4.66667 4.66667 2 10 2H28"
              stroke="white"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}
