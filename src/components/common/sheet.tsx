"use client";

import { AlertDialog, Dialog } from "radix-ui";
import { useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { IconClose } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * v2/BottomSheet — 짧은 작업만. 위 모서리 20, 뒤 화면은 검정 40%.
 * 디자인 메모: 닫기 버튼과 뒤로 가기로 닫히고, 시트 위에 시트를 띄우지 않는다. 아래로 밀면 닫힌다.
 * 초점 가두기·Esc·바깥 누르기 닫기는 Radix Dialog가 맡는다.
 * 끌기는 손잡이·제목 줄에서만 받는다. 내용 칸은 스크롤·버튼이 있어 끌기와 섞이지 않게 한다.
 */

// 이만큼 내리거나 빠르게 내리면 닫는다. 그보다 덜 내리면 제자리로 돌아간다
const CLOSE_DISTANCE = 80;
const CLOSE_VELOCITY = 0.5; // px/ms
// 닫기 버튼을 누를 때 손이 조금 흔들려도 끌기로 보지 않는다
const DRAG_SLOP = 6;

function useDragToClose(onClose: () => void) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ y: number; id: number } | null>(null);
  // 떼기 직전 움직임 두 번으로 「빠르게 내림」을 본다. 누른 순간부터의 평균이면 잠깐 머문 뒤 튕길 때 놓친다
  const samples = useRef<{ y: number; time: number }[]>([]);

  const reset = () => {
    start.current = null;
    setDragging(false);
    setOffset(0);
  };

  const handlers = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      start.current = { y: event.clientY, id: event.pointerId };
      samples.current = [{ y: event.clientY, time: performance.now() }];
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!start.current || start.current.id !== event.pointerId) return;
      const dy = event.clientY - start.current.y;
      if (!dragging) {
        if (dy < DRAG_SLOP) return;
        // 끌기가 시작된 뒤에만 잡는다. 바로 잡으면 닫기 버튼의 클릭이 사라진다
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }
      setOffset(Math.max(0, dy));
      samples.current = [
        ...samples.current.slice(-1),
        { y: event.clientY, time: performance.now() },
      ];
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      if (!start.current || !dragging) {
        start.current = null;
        return;
      }
      const dy = event.clientY - start.current.y;
      const [prev, latest = prev] = samples.current;
      const now = performance.now();
      // 마지막 움직임 뒤 손을 멈췄다가(100ms 넘게) 떼면 튕긴 것이 아니다
      const velocity =
        now - latest.time > 100
          ? 0
          : (latest.y - prev.y) / Math.max(latest.time - prev.time, 1);
      const close = dy > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY;
      reset();
      if (close) onClose();
    },
    onPointerCancel: reset,
  };

  return { offset, dragging, handlers, reset };
}

const overlayClass = "fixed-app inset-y-0 z-50 bg-black/40";
const contentClass =
  "fixed-app bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-sheet bg-bg-page shadow-[0_-4px_12px_rgba(0,0,0,0.12)] outline-none";

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  initialFocus,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** 제목 바로 아래 설명. 화면 읽기 프로그램이 시트 설명으로 읽는다 */
  description?: React.ReactNode;
  /** 내용 아래 고정 줄(BottomCta). 있으면 기기 아래 여백은 그쪽이 맡는다 */
  footer?: React.ReactNode;
  /** 열릴 때 초점을 줄 요소(입력칸 등). 없으면 Radix가 첫 번째로 누를 수 있는 요소(닫기 버튼)에 준다 */
  initialFocus?: React.RefObject<HTMLElement | null>;
  className?: string;
  children: React.ReactNode;
}) {
  const drag = useDragToClose(() => onOpenChange(false));

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) drag.reset();
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClass} />
        <Dialog.Content
          // 설명이 없을 때 Radix가 Description을 찾는 경고를 끈다
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            contentClass,
            !footer && "pb-safe",
            !drag.dragging && "transition-transform duration-200",
            className,
          )}
          style={{ transform: `translateY(${drag.offset}px)` }}
          onOpenAutoFocus={(event) => {
            if (!initialFocus?.current) return;
            event.preventDefault();
            initialFocus.current.focus();
          }}
        >
          {/* 손잡이·제목 줄: 아래로 끌어 닫는 자리. touch-none으로 화면 스크롤과 섞이지 않게 한다 */}
          <div className="touch-none" {...drag.handlers}>
            <div aria-hidden className="flex justify-center pt-2 pb-1">
              <span className="h-1 w-9 rounded-[2px] bg-line-strong" />
            </div>
            <div className="flex items-center py-2 pr-2 pl-5">
              <Dialog.Title className="min-w-0 flex-1 text-title2 text-text-strong">
                {title}
              </Dialog.Title>
              <Dialog.Close
                aria-label="닫기"
                className="flex size-12 shrink-0 items-center justify-center text-icon-default"
              >
                <IconClose />
              </Dialog.Close>
            </div>
          </div>
          {description && (
            // 제목 줄은 닫기 버튼(48) 높이라, 디자인의 제목-설명 간격 6에 맞게 당긴다
            <Dialog.Description className="-mt-1 px-5 text-body1 text-text-sub">
              {description}
            </Dialog.Description>
          )}
          <div className="overflow-y-auto px-5 pt-2 pb-4">{children}</div>
          {footer}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/*
 * 되돌릴 수 없는 일을 묻는 확인 시트(5-7c 지우기 확인 등). 손잡이·닫기 버튼 없이 제목 + 설명 + 버튼 두 개.
 * 바깥을 눌러도 닫히지 않게 AlertDialog를 쓴다.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  danger = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  cancelLabel: React.ReactNode;
  confirmLabel: React.ReactNode;
  onConfirm: () => void;
  /** 지우기·철회처럼 되돌릴 수 없는 일이면 확인 버튼을 빨간색으로 */
  danger?: boolean;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={overlayClass} />
        <AlertDialog.Content
          {...(!description && { "aria-describedby": undefined })}
          className={cn(
            contentClass,
            "gap-3 px-5 pt-7 pb-[max(var(--safe-bottom),12px)]",
          )}
        >
          <AlertDialog.Title className="text-title2 text-text-strong">
            {title}
          </AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="text-body2 whitespace-pre-line text-text-sub">
              {description}
            </AlertDialog.Description>
          )}
          <div className="flex gap-2 pt-3">
            <AlertDialog.Cancel asChild>
              <Button kind="secondary" className="flex-1">
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                kind={danger ? "danger" : "primary"}
                className="flex-1"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
