"use client";

import { useId, useRef, useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { BottomSheet } from "@/components/common/sheet";
import { TextField } from "@/components/common/text-field";
import { checkGtinInput, toGtin14 } from "@/lib/scan/gtin";
import type { Gtin } from "@/lib/scan/types";

/**
 * 3-1 스캔(숫자로 입력). 카메라 위 바텀시트에서 바코드 아래 번호를 받는다.
 *
 * 디자인 메모: 체크 숫자가 틀리면 입력칸 오류 + 도움말 자리에 문장, 입력값은 그대로 두고
 * 「찾기」는 계속 누를 수 있다. 그래서 틀린 번호로는 조회하지 않고 오류만 다시 보인다.
 * 빈 값만 막고 자릿수가 표준이 아닌 번호는 그대로 조회한다(사내 코드·비표준 바코드일 수 있음, `checkGtinInput`).
 * 숫자 외 문자는 입력 즉시 버려서 하이픈이 섞인 번호를 붙여넣어도 받는다.
 */
export function ScanManualSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (gtin: Gtin) => void;
}) {
  const formId = useId();
  // 예전 폼처럼 열자마자 입력칸에 초점을 둔다. iOS는 사용자가 직접 누르지 않으면 키보드를 띄우지 않을 수 있다
  const inputRef = useRef<HTMLInputElement>(null);
  const [digits, setDigits] = useState("");
  const [mismatch, setMismatch] = useState(false);

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        // 닫으면 다음에 열 때 빈 칸으로 시작한다
        if (!next) {
          setDigits("");
          setMismatch(false);
        }
        onOpenChange(next);
      }}
      title="바코드 번호로 찾기"
      initialFocus={inputRef}
      footer={
        <BottomCta>
          <Button
            type="submit"
            form={formId}
            className="flex-1"
            disabled={digits === ""}
          >
            찾기
          </Button>
        </BottomCta>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          const check = checkGtinInput(digits);
          if (check === "empty") return;
          if (check === "checksum-mismatch") {
            setMismatch(true);
            return;
          }
          onSubmit(toGtin14(digits));
          setDigits("");
        }}
      >
        <TextField
          ref={inputRef}
          label="바코드 아래 번호"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={digits}
          onChange={(event) => {
            setDigits(event.target.value.replace(/\D/g, "").slice(0, 14));
            setMismatch(false);
          }}
          status={mismatch ? "error" : undefined}
          message={
            mismatch
              ? "숫자가 맞지 않아요. 바코드 아래 숫자를 다시 확인해 주세요."
              : "8자리 또는 13자리예요"
          }
        />
      </form>
    </BottomSheet>
  );
}
