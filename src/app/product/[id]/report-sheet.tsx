"use client";

import { useEffect, useId, useRef, useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { CheckRow } from "@/components/common/check-row";
import { BottomSheet } from "@/components/common/sheet";
import { TextField } from "@/components/common/text-field";
import { IconFlag, IconImage } from "@/components/icons";
import { cn } from "@/lib/utils";

import { useProductToast } from "./product-actions";

/*
 * 3-2 제품 결과(정보가 틀렸어요). 「정보 수정 요청」을 누르면 3-2 위 바텀시트.
 * 디자인 메모: 자세한 내용·영양성분표 사진은 선택, 사진 칸은 「영양성분 값이 포장과 달라요」를 고를 때만, 연락처 칸 없음.
 * 보내기는 아직 서버로 보내지 않는다(API 연결 때 제보 API로). 그래서 「실패 → 오류 문장 + 고른 내용 유지」는 그때 붙인다.
 * 닫으면(보내기·✕·끌어 닫기) 다음에 열 때 빈 칸으로 시작한다(바코드 번호 시트와 같게). 실패하면 시트를 닫지 않으니 고른 내용은 남는다.
 */
const REASONS = [
  { key: "other-product", label: "다른 제품이 나와요" },
  { key: "name-photo", label: "제품 이름이나 사진이 달라요" },
  { key: "nutrition", label: "영양성분 값이 포장과 달라요" },
  { key: "etc", label: "그 밖의 문제" },
] as const;

type ReasonKey = (typeof REASONS)[number]["key"];

export function ReportButton() {
  const showToast = useProductToast();
  const errorId = useId();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<ReadonlySet<ReasonKey>>(new Set());
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
  // 오류가 떠 있는 채로 다시 눌러도 다시 읽히게 안쪽 노드를 바꾼다
  const [errorKey, setErrorKey] = useState(0);
  // 같은 내용을 다시 보내면 「이미 보내 주신 내용이에요」(디자인 메모). 서버 연결 전이라 이 화면에서 보낸 것만 기억한다
  const [sent, setSent] = useState<string[]>([]);

  const reset = () => {
    setPicked(new Set());
    setDetail("");
    setPhoto(null);
    setError(false);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const toggle = (key: ReasonKey) => {
    setError(false);
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
    // 사진은 판정에 넣지 않는다. 같은 제보를 어떻게 가를지는 제보 API의 중복 응답이 정해질 때 맞춘다
    const signature = [...picked].sort().join(",") + "|" + detail.trim();
    close();
    if (sent.includes(signature)) {
      showToast({ message: "이미 보내 주신 내용이에요. 확인 중이에요." });
      return;
    }
    setSent((prev) => [...prev, signature]);
    showToast({
      message:
        "보내 주셔서 고마워요. 확인 결과는 내 정보 › 내 요청·제보에서 볼 수 있어요.",
    });
  };

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
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (next) setOpen(true);
          else close();
        }}
        title="어떤 정보가 틀렸나요?"
        description={
          // 이 시트만 설명이 body2(디자인). 공통 시트의 body1을 덮는다
          <span className="block pb-2 text-body2">
            알려 주신 내용은 운영팀이 확인한 뒤 고쳐요.
          </span>
        }
        footer={
          <BottomCta>
            <Button type="submit" form={formId} className="flex-1">
              보내기
            </Button>
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
            {REASONS.map((r) => (
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
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
          />
          {picked.has("nutrition") && (
            <PhotoField photo={photo} onChange={setPhoto} />
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
            사진 더하기
          </>
        )}
      </label>
    </div>
  );
}
