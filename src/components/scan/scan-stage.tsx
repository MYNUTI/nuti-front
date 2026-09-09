"use client";

import { useState } from "react";
import { IconCamera } from "@/components/icons";
import {
  ScanResultSheet,
  type ScanResult,
} from "@/components/scan/scan-result-sheet";

/** 뷰파인더 탭은 바코드 인식을 대신하는 임시 트리거다. */
export function ScanStage({ results }: { results: ScanResult[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const result = index === null ? null : results[index];

  return (
    <>
      <button
        type="button"
        aria-label="다음 제품 인식"
        onClick={() =>
          setIndex((prev) => (prev === null ? 0 : (prev + 1) % results.length))
        }
        className="flex aspect-7/8 w-full flex-col items-center justify-center gap-3 rounded-3xl bg-muted"
      >
        <IconCamera className="size-14 text-muted-foreground" />
        {result && (
          <span className="text-[13px] text-muted-foreground">
            카메라 계속 인식 중
          </span>
        )}
      </button>

      {result && <ScanResultSheet result={result} />}
    </>
  );
}
