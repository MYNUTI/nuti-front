"use client";

import { Dialog } from "radix-ui";
import { useLayoutEffect, useState } from "react";

import { cn } from "@/lib/utils";

/*
 * 피그마 컴포넌트 v2/Coachmark — 튜토리얼 말풍선.
 * 화면 위에 검정(#111418) 60% 막을 깔고 가리킬 곳만 뚫어 밝게 둔다. 꼬리는 가리킬 곳 쪽.
 * 가리킬 곳은 data-guide 속성으로 찾아 실제 위치를 잰다.
 * 막이 떠 있는 동안 뒤 화면은 스크롤·누르기가 막히고, 밝힌 자리도 눌리지 않는다(가이드 중 다른 화면으로 넘어가지 않게).
 * 초점 가두기·스크롤 막기·Esc는 Radix Dialog가 맡는다. 막 바깥을 눌러서는 닫히지 않고, Esc는 onClose를 부른다.
 */
type Rect = { top: number; left: number; width: number; height: number };

const BUBBLE_MAX_WIDTH = 320;
// 화면 가장자리에서 말풍선이 떨어질 최소 거리
const EDGE = 16;

export function Coachmark({
  target,
  shape,
  padding,
  placement,
  tailOffset,
  title,
  body,
  actions,
  onClose,
}: {
  /** 가리킬 요소의 data-guide 값 */
  target: string;
  /** circle: 원형 구멍 · rounded: 모서리 16 구멍 */
  shape: "circle" | "rounded";
  /** 요소 바깥으로 넓힐 구멍 여백(px) */
  padding: number;
  /** 말풍선을 구멍 위(above)·아래(below) 중 어디에 둘지 */
  placement: "above" | "below";
  /** 꼬리 왼쪽 위치(말풍선 왼쪽 기준 px). 없으면 구멍 가운데를 가리킨다 */
  tailOffset?: number;
  title: React.ReactNode;
  body: React.ReactNode;
  actions: React.ReactNode;
  /** Esc로 닫을 때 */
  onClose: () => void;
}) {
  const [layout, setLayout] = useState<{
    hole: Rect;
    viewport: { width: number; height: number };
  } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector(`[data-guide="${target}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setLayout({
        hole: {
          top: r.top - padding,
          left: r.left - padding,
          width: r.width + padding * 2,
          height: r.height + padding * 2,
        },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [target, padding]);

  if (!layout) return null;

  const { hole, viewport } = layout;
  const bubbleWidth = Math.min(BUBBLE_MAX_WIDTH, viewport.width - EDGE * 2);
  const bubbleLeft = Math.min(
    Math.max(EDGE, hole.left + hole.width / 2 - bubbleWidth / 2),
    viewport.width - EDGE - bubbleWidth,
  );
  const tailLeft = tailOffset ?? hole.left + hole.width / 2 - bubbleLeft - 10;
  // 피그마: 구멍 위 말풍선은 꼬리 끝과 구멍 사이 18px, 구멍 아래 말풍선은 8px
  const bubbleStyle: React.CSSProperties = {
    left: bubbleLeft,
    width: bubbleWidth,
    ...(placement === "above"
      ? { bottom: viewport.height - hole.top + 18 }
      : { top: hole.top + hole.height + 8 }),
  };

  const tail = (
    <svg
      aria-hidden
      width={20}
      height={10}
      viewBox="0 0 20 10"
      className={cn(
        "block fill-bg-page",
        placement === "below" && "rotate-180",
      )}
      style={{ marginLeft: tailLeft }}
    >
      <path d="M0 0L10 10L20 0H0Z" />
    </svg>
  );

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* 막 전체가 뒤 화면 누르기를 막고, 구멍 밖은 그림자로 덮는다 */}
        <Dialog.Overlay className="fixed inset-0 z-50" />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none fixed z-50 shadow-[0_0_0_9999px_rgba(17,20,24,0.6)]",
            shape === "circle" ? "rounded-full" : "rounded-lg",
          )}
          style={hole}
        />
        <Dialog.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed z-50 flex flex-col outline-none"
          style={bubbleStyle}
        >
          {placement === "below" && tail}
          <div className="flex flex-col gap-1.5 rounded-lg bg-bg-page px-[18px] pt-4 pb-3.5">
            <Dialog.Title className="text-body1-bold text-text-strong">
              {title}
            </Dialog.Title>
            <Dialog.Description className="text-body2 whitespace-pre-line text-text-body">
              {body}
            </Dialog.Description>
            <div className="flex items-center justify-end gap-3 pt-1.5">
              {actions}
            </div>
          </div>
          {placement === "above" && tail}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
