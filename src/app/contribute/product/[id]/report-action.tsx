"use client";

import { useState } from "react";

import { Toast } from "@/components/common/toast";
import { IconFlag } from "@/components/icons";
import { ReportSheet } from "@/components/product/report-sheet";

/** 3-6 「정보 수정 요청」 글자 버튼 → 3-2와 같은 정보가 틀렸어요 시트, 보낸 뒤 알림은 아래 고정 버튼 위 */
export function ReportAction() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<{ id: number; message: string } | null>(
    null,
  );

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-1.5 self-start px-5 py-3 text-body2-medium text-text-sub"
        onClick={() => setOpen(true)}
      >
        <IconFlag className="size-4" />
        정보 수정 요청
      </button>
      <ReportSheet
        open={open}
        onOpenChange={setOpen}
        onSent={(message) =>
          setSent((prev) => ({ id: (prev?.id ?? 0) + 1, message }))
        }
      />
      {sent && (
        <Toast
          key={sent.id}
          message={sent.message}
          // 아래 고정 버튼 줄(위 여백 12 + 버튼 52 + 기기 아래 여백) 위 12
          className="bottom-[calc(76px+max(var(--safe-bottom),12px))]"
        />
      )}
    </>
  );
}
