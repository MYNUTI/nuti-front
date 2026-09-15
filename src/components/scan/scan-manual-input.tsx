"use client";

import { useState } from "react";
import { CtaButton } from "@/components/common/cta-button";
import { checkGtinInput, toGtin14, type GtinInputCheck } from "@/lib/scan/gtin";
import type { Gtin } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

const HINT: Record<Exclude<GtinInputCheck, "empty">, string> = {
  valid: "올바른 바코드 번호예요",
  "checksum-mismatch":
    "마지막 확인 숫자가 맞지 않아요. 번호를 다시 확인해 주세요",
  "nonstandard-length": "상품 바코드는 보통 8·12·13자리예요",
};

/**
 * 바코드 번호 직접 입력.
 *
 * 빈 값만 막고 나머지는 경고만 한다(`checkGtinInput`). 숫자 외 문자는 입력 즉시 버려서
 * 하이픈이 섞인 번호를 붙여넣어도 받는다.
 */
export function ScanManualInput({
  onSubmit,
}: {
  onSubmit: (gtin: Gtin) => void;
}) {
  const [digits, setDigits] = useState("");
  const check = checkGtinInput(digits);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (check !== "empty") onSubmit(toGtin14(digits));
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        aria-label="바코드 번호"
        placeholder="바코드 아래 숫자"
        value={digits}
        onChange={(event) =>
          setDigits(event.target.value.replace(/\D/g, "").slice(0, 14))
        }
        className="h-12 rounded-2xl border border-border bg-card px-4 text-base tracking-wider"
      />

      {check !== "empty" && (
        <p
          className={cn(
            "text-[13px]",
            check === "checksum-mismatch"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {HINT[check]}
        </p>
      )}

      <CtaButton type="submit" className="h-12" disabled={check === "empty"}>
        조회하기
      </CtaButton>
    </form>
  );
}
