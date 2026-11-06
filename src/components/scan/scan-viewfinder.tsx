"use client";

import type { RefObject } from "react";

import { CameraFrame } from "@/components/common/camera-frame";
import { cn } from "@/lib/utils";

/**
 * 카메라 화면. 표시만 담당하고 디코딩은 모른다.
 *
 * `playsInline`·`muted`·`autoPlay`는 react-zxing이 재생 직전에 직접 설정하므로
 * 여기서 지정하지 않아도 iOS가 전체화면으로 전환되지 않는다.
 *
 * 조준 틀은 보이는 안내일 뿐이고 디코딩은 영상 전체에서 한다.
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
      className={cn("relative w-full overflow-hidden bg-[#2b3034]", className)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
      />
      <CameraFrame live className="absolute inset-0" />
      {children}
    </div>
  );
}
