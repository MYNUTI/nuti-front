"use client";

import { AlertDialog, Dialog } from "radix-ui";

import { Button } from "@/components/common/button";
import { IconClose } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 피그마 컴포넌트 v2/BottomSheet — 짧은 작업만. 위 모서리 20, 뒤 화면은 검정 40%.
 * 피그마 메모: 닫기 버튼과 뒤로 가기로 닫히고, 시트 위에 시트를 띄우지 않는다.
 * 초점 가두기·Esc·바깥 누르기 닫기는 Radix Dialog가 맡는다.
 */

const overlayClass = "fixed-app inset-y-0 z-50 bg-black/40";
const contentClass =
  "fixed-app bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-sheet bg-bg-page shadow-[0_-4px_12px_rgba(0,0,0,0.12)] outline-none";

export function BottomSheet({
  open,
  onOpenChange,
  title,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClass} />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(contentClass, "pb-safe", className)}
        >
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
          <div className="overflow-y-auto px-5 pt-2 pb-4">{children}</div>
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
