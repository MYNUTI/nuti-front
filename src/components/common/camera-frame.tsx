import { cn } from "@/lib/utils";

/*
 * v2/CameraFrame — 카메라 화면 자리. 어두운 바탕 + 가운데 조준 틀 + 흰 모서리 4개.
 * 조준 틀은 바코드 280×160, 성분표 320×420. 위에는 TopBar tone=dark, 아래에는 안내 문장·dark 버튼을 놓는다.
 * 색은 디자인 변수가 아니라 컴포넌트에 직접 넣은 값이다.
 * live는 실제 카메라 영상 위에 겹칠 때 쓴다. 바탕을 비우고, 틀 밖만 어둡게 눌러 틀 안이 밝아 보이게 한다
 * (디자인의 바깥 #2b3034 · 틀 안 #454b50 차이를 영상 위에서 낸 것).
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
  live = false,
  className,
}: {
  shape?: keyof typeof WINDOW;
  live?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden",
        live ? "pointer-events-none" : "bg-[#2b3034]",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "relative shrink-0 rounded-lg",
          live ? "shadow-[0_0_0_100vmax_rgba(17,20,24,0.4)]" : "bg-[#454b50]",
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
