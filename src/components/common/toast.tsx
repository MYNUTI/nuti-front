"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/*
 * 알림 띠(토스트). 화면 아래 가운데, 아래 고정 줄이나 하단 탭 바로 위. 바탕 검정 80%.
 * 띄우는 쪽이 렌더링하면 보였다가 DURATION_MS 뒤에 사라진다.
 * 떠 있는 채로 message만 바꾸면 다시 뜨지 않는다. 다시 띄우려면 key를 바꿔 새로 마운트한다.
 * 기본 위치는 하단 탭(56) + 위로 튀어나온 스캔 버튼(24) + 8 위. 아래 고정 줄 위에 띄울 때는 className으로 bottom을 덮어 쓴다.
 */
// 영역이 먼저 붙은 뒤 문장을 넣어야 화면 읽기 프로그램이 읽는다
const SHOW_DELAY_MS = 100;
const DURATION_MS = 3_000;

export function Toast({
  message,
  className,
}: {
  message: React.ReactNode;
  className?: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setShown(true), SHOW_DELAY_MS);
    const hide = setTimeout(() => setShown(false), SHOW_DELAY_MS + DURATION_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  // 라이브 영역은 늘 두고 안쪽만 바꾼다(LoadingState와 같은 이유)
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none fixed-app bottom-[calc(88px+var(--safe-bottom))] z-50 flex justify-center px-5",
        className,
      )}
    >
      {shown && (
        <p className="rounded-[10px] bg-[rgba(17,20,24,0.8)] px-4 py-3 text-[14px] leading-[17px] font-medium text-white">
          {message}
        </p>
      )}
    </div>
  );
}
