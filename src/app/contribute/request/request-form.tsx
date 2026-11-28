"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import { BackButton } from "@/components/common/back-button";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { TextField } from "@/components/common/text-field";
import { TopBar } from "@/components/common/top-bar";
import { IconImage } from "@/components/icons";
import { addRequestedHere } from "@/components/scan/requested-gtins";
import { useRequestAnalysis } from "@/lib/contribution/queries";
import { cn } from "@/lib/utils";
import type { Gtin } from "@/lib/scan/types";

import {
  BRAND_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NETWORK_FAILED,
  requestFailMessage,
  toRequestInput,
} from "./request-input";

/*
 * 3-6 제품 요청하기 입력 화면(시트 3-6과 다른 화면). 「제품 이름」(필수) · 「브랜드(선택)」 · 「영양성분표 사진(선택)」,
 * 아래 고정 「보내기」.
 * - 「사진 추가」 → 3-7 영양성분표 찍기 → 3-8 읽은 값 확인. 여기서 적은 이름 · 브랜드는 3-8의 제품 이름 칸에 채워 넘긴다(메모)
 * - 이름을 비우면 칸 아래 「제품 이름을 적어 주세요.」
 * - 「보내기」 → 분석 요청(`POST /analysis-requests`, 제품명 요청)을 보내고 4-3 내 기록(분석 요청, 방금 보냈을 때)으로
 *   바꿔 간다(replace). 어디서 왔는지는 스캔 3-6이면 바코드(`originBarcode`), 검색 0건이면 검색어(`originKeyword`)로 함께 보낸다.
 *   바코드로 왔으면 이 기기가 요청한 바코드로 남겨 3-6 시트가 「이미 요청하셨어요」를 보이게 한다
 * - 보내는 동안은 다시 누르지 않게 막는다(제품명 요청은 보낼 때마다 새 요청이 된다)
 * - 실패하면 「보내지 못했어요…」(적은 내용은 그대로), 서버가 거절했으면 그 이유(하루 5건 한도 등). 미리 보기 `?state=failed`
 * - 사진은 3-7 → 3-8로 이어지는 다른 길이라 이 요청에는 싣지 않는다
 */
export function RequestForm({
  initialName,
  originKeyword,
  gtin,
  failPreview,
}: {
  initialName: string;
  /** 검색 0건에서 왔으면 그 검색어 */
  originKeyword: string | null;
  gtin: Gtin | null;
  failPreview: boolean;
}) {
  const router = useRouter();
  const formId = useId();
  const [name, setName] = useState(initialName);
  const [brand, setBrand] = useState("");
  const [nameError, setNameError] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const request = useRequestAnalysis();
  const nameInput = useRef<HTMLInputElement>(null);
  const brandInput = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!name.trim()) {
      setNameError(true);
      nameInput.current?.focus();
      return;
    }
    if (failPreview) {
      setFailed(NETWORK_FAILED);
      return;
    }
    // 성공 뒤에도 4-3으로 바꿔 가기(화면 이동)가 끝날 때까지 폼이 남아 있어, 그동안 다시 보내지 않게 한다
    if (request.isPending || request.isSuccess) return;
    request.mutate(toRequestInput({ name, brand, gtin, originKeyword }), {
      onSuccess: () => {
        if (gtin) addRequestedHere(gtin);
        // 「보냈어요…」 알림은 4-3이 `sent`를 보고 띄운다
        // 바꿔 가서 뒤로 가기에 다 적은 폼이 다시 열려 한 번 더 보내지 않게 한다
        router.replace("/history?tab=requests&sent=request");
      },
      onError: (error) => setFailed(requestFailMessage(error)),
    });
  };

  // 3-7 → 3-8로 이름 · 브랜드 · 바코드를 이어 넘긴다(3-7 · 3-8은 08단계 다음 순서)
  const labelParams = new URLSearchParams();
  if (name.trim()) labelParams.set("name", name.trim());
  if (brand.trim()) labelParams.set("brand", brand.trim());
  if (gtin) labelParams.set("gtin", gtin);
  const labelQuery = labelParams.toString();

  return (
    <main className="flex flex-1 flex-col bg-bg-page pt-safe pb-[calc(76px+max(var(--safe-bottom),12px))]">
      <TopBar
        title="제품 요청하기"
        left={<BackButton fallbackHref="/home" />}
      />
      <div className="flex flex-col gap-2 px-5 pt-2 pb-7">
        <h2 className="text-title1 text-text-strong">어떤 제품인가요?</h2>
        <p className="text-body1 text-text-sub">
          분석이 끝나면 기록 › 분석 요청에서
          <br />
          점수를 볼 수 있어요.
        </p>
      </div>
      <form
        id={formId}
        noValidate
        className="flex flex-col gap-5 px-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <TextField
          ref={nameInput}
          label="제품 이름"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(false);
            setFailed(null);
          }}
          status={nameError ? "error" : undefined}
          message={nameError ? "제품 이름을 적어 주세요." : undefined}
          aria-required
          maxLength={NAME_MAX_LENGTH}
          enterKeyHint="next"
          autoComplete="off"
          // 키보드의 「다음」은 브랜드 칸으로. Enter가 폼을 바로 보내지 않게 하고, 한글 조합 중인 Enter는 건너뛴다
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            event.preventDefault();
            brandInput.current?.focus();
          }}
        />
        <TextField
          ref={brandInput}
          label="브랜드(선택)"
          placeholder="포장 앞면에 적힌 회사 이름"
          value={brand}
          onChange={(event) => {
            setBrand(event.target.value);
            setFailed(null);
          }}
          maxLength={BRAND_MAX_LENGTH}
          enterKeyHint="done"
          autoComplete="off"
        />
      </form>
      <div className="flex flex-col gap-2 px-5 pt-6">
        <p className="text-body2-medium text-text-body">
          영양성분표 사진(선택)
        </p>
        <Link
          href={`/contribute/label${labelQuery ? `?${labelQuery}` : ""}`}
          aria-describedby={`${formId}-photo-help`}
          className="flex size-22 flex-col items-center justify-center gap-1 rounded-md border-[1.5px] border-dashed border-line-strong text-body2 text-text-sub"
        >
          <IconImage className="size-6" />
          사진 추가
          <span className="sr-only">(영양성분표 찍기)</span>
        </Link>
        <p id={`${formId}-photo-help`} className="text-body2 text-text-sub">
          사진의 숫자가 읽히면 값을 확인한 뒤 점수를 볼 수 있어요.
        </p>
      </div>

      <BottomCta className="fixed-app bottom-0 z-20">
        <div className="flex flex-1 flex-col">
          {/* 실패 문장 자리는 그림이 없어 버튼 바로 위(남은 질문 43). 영역이 먼저 있어야 읽으므로 늘 두고 글자만 바꾼다 */}
          <p
            role="alert"
            className={cn("text-body2 text-text-danger", failed && "pb-2")}
          >
            {failed ?? ""}
          </p>
          {/* 보내는 동안은 submit이 막는다. disabled로 막으면 키보드 포커스가 빠진다 */}
          <Button
            type="submit"
            form={formId}
            className="w-full"
            aria-disabled={request.isPending || request.isSuccess}
          >
            보내기
          </Button>
        </div>
      </BottomCta>
    </main>
  );
}
