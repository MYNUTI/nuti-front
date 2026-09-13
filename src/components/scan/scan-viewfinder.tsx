"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/utils";

/**
 * 카메라 화면. 표시만 담당하고 디코딩은 모른다.
 *
 * `playsInline`·`muted`·`autoPlay`는 react-zxing이 재생 직전에 직접 설정하므로
 * 여기서 지정하지 않아도 iOS가 전체화면으로 전환되지 않는다.
 */
export function ScanViewfinder({
  videoRef,
  className,
  children,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-3xl bg-muted",
        className,
      )}
    >
      <video ref={videoRef} className="size-full object-cover" />

      {/* 가로는 넉넉히, 세로는 좁게 — 1D 바코드는 세로가 반복이라 잘라도 읽히지만
          가로를 자르면 quiet zone을 침범해 디코딩이 실패한다. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-1/2 h-28 -translate-y-1/2 rounded-xl border-2 border-white/80"
      />

      {children}
    </div>
  );
}
