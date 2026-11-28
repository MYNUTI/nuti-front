"use client";

import { useEffect, useId, useRef, useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { CheckRow } from "@/components/common/check-row";
import { BottomSheet } from "@/components/common/sheet";
import { TextField } from "@/components/common/text-field";
import { IconImage } from "@/components/icons";
import { useReportProduct } from "@/lib/contribution/queries";
import { cn } from "@/lib/utils";

import {
  needsDetail,
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_REASONS,
  reportFailMessage,
  reportSentMessage,
  toReportInput,
  type ReportReasonKey,
} from "./report-input";

/*
 * 3-2 제품 결과(정보가 틀렸어요) 바텀시트. 3-2의 「정보 수정 요청」과 3-6 이름을 아는 바코드 시트의 「정보 수정 요청」이 연다.
 * 디자인 메모: 자세한 내용·영양성분표 사진은 선택, 사진 칸은 「영양성분 값이 포장과 달라요」를 고를 때만, 연락처 칸 없음.
 * `productId`가 있으면 제보 API(`POST /products/{id}/reports`)로 보낸다. 없으면(아직 임시 데이터로 그리는 화면) 서버로
 * 보내지 않고 이 시트에서 보낸 것만 기억한다. 실패하면 시트를 닫지 않고 보내기 위에 ⑩ 상태표 문장
 * 「보내지 못했어요. …고른 내용은 그대로 있어요.」(그림 없음 — 3-6 제품 요청하기와 같은 자리), 서버가 거절했으면 그 이유.
 * 미리 보기는 `failPreview`. 보내는 동안에는 닫지 않는다(닫은 뒤 늦게 온 실패가 다음에 열 때 남지 않게).
 * 사진은 v3 제보 API가 받지 않아 보내지 않는다(API 플랜 「남은 질문」).
 * 닫으면(보내기·✕·끌어 닫기) 다음에 열 때 빈 칸으로 시작한다(바코드 번호 시트와 같게). 실패하면 시트를 닫지 않으니 고른 내용은 남는다.
 */

export function ReportSheet({
  productId,
  barcode,
  open,
  onOpenChange,
  onSent,
  failPreview = false,
}: {
  /** 상세 경로와 같은 문자열 ID. 없으면 서버로 보내지 않는다(화면을 API에 연결하기 전) */
  productId?: string;
  /** 바코드로 찾은 제품이면 그 바코드(운영자가 바코드 연결이 틀렸는지 본다) */
  barcode?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 보낸 뒤 알림 문장(띄우는 쪽이 자기 알림 띠에 보인다) */
  onSent: (message: string) => void;
  /** 보내기가 실패한 모습 미리 보기(3-2 `?state=report-failed`) */
  failPreview?: boolean;
}) {
  const errorId = useId();
  const formId = useId();
  const [picked, setPicked] = useState<ReadonlySet<ReportReasonKey>>(new Set());
  const [detail, setDetail] = useState("");
  const [photo, setPhotoState] = useState<Photo | null>(null);
  // 미리 보기 주소는 바꾸거나 비울 때, 화면을 떠날 때 돌려준다
  const photoRef = useRef<Photo | null>(null);
  const setPhoto = (next: Photo | null) => {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current.url);
    photoRef.current = next;
    setPhotoState(next);
  };
  useEffect(
    () => () => {
      if (photoRef.current) URL.revokeObjectURL(photoRef.current.url);
    },
    [],
  );
  const [error, setError] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const detailInput = useRef<HTMLInputElement>(null);
  // 오류가 떠 있는 채로 다시 눌러도 다시 읽히게 안쪽 노드를 바꾼다
  const [errorKey, setErrorKey] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  // 서버로 보내지 않을 때 같은 내용을 다시 보내면 「이미 보내 주신 내용이에요」(디자인 메모). 이 시트에서 보낸 것만 기억한다
  const [sent, setSent] = useState<string[]>([]);
  const report = useReportProduct();

  const reset = () => {
    setPicked(new Set());
    setDetail("");
    setPhoto(null);
    setError(false);
    setDetailError(false);
    setFailed(null);
  };

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const toggle = (key: ReportReasonKey) => {
    setError(false);
    setDetailError(false);
    setFailed(null);
    // 사진 칸이 사라지면 보이지 않는 사진이 함께 보내지지 않게 비운다
    if (key === "nutrition" && picked.has("nutrition")) setPhoto(null);
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = () => {
    if (picked.size === 0) {
      setError(true);
      setErrorKey((k) => k + 1);
      return;
    }
    if (needsDetail(picked, detail)) {
      setDetailError(true);
      // 문장은 칸에 묶여 있어 칸으로 옮기면 함께 읽힌다
      detailInput.current?.focus();
      return;
    }
    if (failPreview) {
      setFailed(reportFailMessage(null));
      return;
    }
    if (productId === undefined) {
      const signature = [...picked].sort().join(",") + "|" + detail.trim();
      close();
      onSent(reportSentMessage({ duplicate: sent.includes(signature) }));
      if (!sent.includes(signature)) setSent((prev) => [...prev, signature]);
      return;
    }
    const input = toReportInput({ productId, barcode, picked, detail });
    if (!input) return;
    report.mutate(input, {
      onSuccess: (result) => {
        close();
        onSent(reportSentMessage(result));
      },
      onError: (error) => setFailed(reportFailMessage(error)),
    });
  };

  return (
    <>
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (next) onOpenChange(true);
          else if (!report.isPending) close();
        }}
        title="어떤 정보가 틀렸나요?"
        description={
          // 이 시트만 설명이 body2(디자인). 공통 시트의 body1을 덮는다
          <span className="block pb-2 text-body2">
            알려 준 내용은 운영팀이 확인한 뒤 고쳐요.
          </span>
        }
        footer={
          <BottomCta>
            <div className="flex flex-1 flex-col">
              {/* 영역이 먼저 있어야 읽으므로 늘 두고 글자만 바꾼다 */}
              <p
                role="alert"
                className={cn("text-body2 text-text-danger", failed && "pb-2")}
              >
                {failed ?? ""}
              </p>
              <Button
                type="submit"
                form={formId}
                className="w-full"
                disabled={report.isPending}
              >
                보내기
              </Button>
            </div>
          </BottomCta>
        }
      >
        {/* 디자인은 칸 양옆 여백 20을 행이 직접 가진다(CheckRow px-5). 시트 내용 여백만큼 당긴다 */}
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <fieldset className="-mx-5">
            <legend className="sr-only">틀린 내용</legend>
            {REPORT_REASONS.map((r) => (
              <CheckRow
                key={r.key}
                label={r.label}
                checked={picked.has(r.key)}
                onChange={() => toggle(r.key)}
                aria-describedby={error ? errorId : undefined}
              />
            ))}
          </fieldset>
          <p
            id={errorId}
            role="alert"
            className={cn("text-body2 text-text-danger", error && "pt-1")}
          >
            {error && (
              <span key={errorKey}>틀린 내용을 하나 이상 골라 주세요.</span>
            )}
          </p>
          <TextField
            className="pt-3"
            label="자세한 내용(선택)"
            placeholder="예: 포장에는 당류 2g으로 적혀 있어요"
            ref={detailInput}
            maxLength={REPORT_DETAIL_MAX_LENGTH}
            value={detail}
            status={detailError ? "error" : undefined}
            message={
              detailError
                ? "그 밖의 문제를 골랐다면 자세한 내용을 적어 주세요."
                : undefined
            }
            onChange={(event) => {
              setDetail(event.target.value);
              setFailed(null);
              setDetailError(false);
            }}
          />
          {picked.has("nutrition") && (
            <PhotoField
              photo={photo}
              onChange={(next) => {
                setPhoto(next);
                setFailed(null);
              }}
            />
          )}
        </form>
      </BottomSheet>
    </>
  );
}

type Photo = { file: File; url: string };

/** 영양성분표 사진(선택). 한 장을 골라 미리 보이고, 다시 누르면 바꾼다 */
function PhotoField({
  photo,
  onChange,
}: {
  photo: Photo | null;
  onChange: (photo: Photo | null) => void;
}) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-2 pt-6">
      <label htmlFor={inputId} className="text-body2 text-text-body">
        영양성분표 사진(선택)
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="peer sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange({ file, url: URL.createObjectURL(file) });
        }}
      />
      <label
        htmlFor={inputId}
        className="flex size-22 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-md border-[1.5px] border-dashed border-line-strong text-body2 text-text-sub peer-focus-visible:outline-2 peer-focus-visible:outline-text-strong"
      >
        {photo ? (
          // 사용자가 고른 사진을 바로 보여 주는 미리 보기라 next/image를 쓰지 않는다
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt="고른 영양성분표 사진"
            className="size-full object-cover"
          />
        ) : (
          <>
            <IconImage className="size-6" />
            사진 추가
          </>
        )}
      </label>
    </div>
  );
}
