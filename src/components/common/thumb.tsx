import { cn } from "@/lib/utils";

/*
 * v2/Thumb — 제품 사진 자리 64. 옅은 회색 바탕 위에 사진을 맞춰 넣는다(안쪽 여백 6.25%).
 * 사진이 없을 때 넣을 그림(종류별 3D 그림)은 쓰는 화면이 정해 children으로 넣는다.
 */
export function Thumb({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative block size-16 shrink-0 overflow-hidden rounded-md bg-bg-tint",
        className,
      )}
    >
      {children && (
        <span className="absolute inset-[6.25%] *:size-full *:object-contain">
          {children}
        </span>
      )}
    </span>
  );
}
