"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/*
 * 알림 띠(토스트). 화면 아래 가운데, 아래 고정 줄이나 하단 탭 바로 위. 【최종】 바탕 #414346 불투명, 글자 버튼은 라임.
 * 【최종】 프레임마다 모서리(10 · 12) · 위아래 여백(10 · 12)이 달라 토큰 값(radius/md 12)과 Body2(줄 20)로 맞췄다.
 * 띄우는 쪽이 렌더링하면 보였다가 DURATION_MS 뒤에 사라진다.
 * 떠 있는 채로 message만 바꾸면 다시 뜨지 않는다. 다시 띄우려면 key를 바꿔 새로 마운트한다.
 * 기본 위치는 화면 아래(안전 영역 빼고)에서 93(【최종】 2-1 홈 계정 삭제). 아래 고정 줄 위에 띄울 때는 className으로 bottom을 덮어 쓴다.
 */
// 영역이 먼저 붙은 뒤 문장을 넣어야 화면 읽기 프로그램이 읽는다
const SHOW_DELAY_MS = 100;
const DURATION_MS = 3_000;

export function Toast({
  message,
  action,
  className,
}: {
  message: React.ReactNode;
  /** 문장 옆 글자 버튼(「되돌리기」 등). 있으면 알림 띠만 눌린다 */
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  const [gone, setGone] = useState(false);
  // 글자 버튼에 손가락·마우스·키보드가 닿아 있는 동안은 사라지지 않게 한다. 벗어나면 다시 DURATION_MS를 센다
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setShown(true), SHOW_DELAY_MS);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    if (!shown || held || gone) return;
    const hide = setTimeout(() => setGone(true), DURATION_MS);
    return () => clearTimeout(hide);
  }, [shown, held, gone]);

  // 라이브 영역은 늘 두고 안쪽만 바꾼다(LoadingState와 같은 이유)
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none fixed-app bottom-[calc(93px+var(--safe-bottom))] z-50 flex justify-center px-5",
        className,
      )}
    >
      {shown && !gone && (
        <div
          className={cn(
            // 좁은 화면에서 두 줄이 될 때 낱말 중간에서 끊기지 않게 한다(break-keep)
            "flex items-center gap-3 rounded-md bg-[#414346] px-4 py-3 text-body2-medium break-keep text-white",
            // 글자 버튼이 없으면 아래(하단 탭 등)를 가리지 않게 누를 수 없는 띠로 둔다
            action && "pointer-events-auto",
          )}
          onPointerEnter={action && (() => setHeld(true))}
          onPointerLeave={action && (() => setHeld(false))}
          onFocus={action && (() => setHeld(true))}
          onBlur={action && (() => setHeld(false))}
        >
          <p>{message}</p>
          {action && (
            <button
              type="button"
              className="shrink-0 font-bold text-brand-primary"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
