"use client";

import { useState } from "react";

import { IconFlag } from "@/components/icons";
import { ReportSheet } from "@/components/product/report-sheet";

import { useProductToast } from "./product-actions";

/** 3-2 「정보 수정 요청」 글자 버튼. 누르면 정보가 틀렸어요 시트, 보낸 뒤 알림은 3-2의 알림 띠 */
export function ReportButton({
  productId,
  failPreview = false,
}: {
  productId: string;
  failPreview?: boolean;
}) {
  const showToast = useProductToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-1.5 px-5 pt-2 pb-7 text-body2-medium text-text-sub"
        onClick={() => setOpen(true)}
      >
        <IconFlag className="size-4" />
        정보 수정 요청
      </button>
      <ReportSheet
        productId={productId}
        open={open}
        onOpenChange={setOpen}
        onSent={(message) => showToast({ message })}
        failPreview={failPreview}
      />
    </>
  );
}
