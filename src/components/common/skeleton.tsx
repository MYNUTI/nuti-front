import { cn } from "@/lib/utils";

/*
 * 공통 상태 「불러오는 중」의 회색 자리. 그 화면 배치 그대로 자리를 그린다(크기는 className으로).
 * 글자 자리는 모서리 6, 사진 자리는 rounded-md를 덮어 쓴다.
 * 디자인 메모: 기기의 「동작 줄이기」 설정이면 움직이지 않는 회색.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-pulse rounded-[6px] bg-bg-band motion-reduce:animate-none",
        className,
      )}
    />
  );
}
