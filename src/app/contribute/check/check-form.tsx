"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import { BackButton, useGoBack } from "@/components/common/back-button";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { Chip } from "@/components/common/chip";
import { TextField } from "@/components/common/text-field";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconChevronDown, IconClose } from "@/components/icons";
import { addRequestedHere } from "@/components/scan/requested-gtins";
import type { Gtin } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

import type { LabelReading } from "../_fixtures";
import { clearLabelPhoto, getLabelPhoto } from "../label-photo";
import {
  BASIS_LABEL,
  type Basis,
  type Blocker,
  checkKeys,
  cleanNumber,
  firstBlocker,
  hasAmount,
  isBlank,
  type NutrientKey,
  NUTRIENTS,
} from "./nutrients";

const noop = () => () => {};

const AMOUNT_LABEL = {
  serving: "1회 제공량 무게",
  total: "총 내용량",
} as const;

/*
 * 3-8 읽은 값 확인(【최종】 ⑦ 9306:21648 · 맞아요를 눌렀을 때 21881 · 총 내용량 기준일 때 9723:20237 ·
 * 표시 기준을 고르지 않았을 때 9846:19007).
 * 머리(제목 · 설명 · 찍은 사진 「크게 보기」), 「확인할 곳 n개」 띠, 제품 이름(선택), 포장 표 기준 칩, (1회 제공량 무게 ·
 * 총 내용량 + 단위 칩), 영양성분 10칸, 「사진 다시 찍기 · 이 사진 그대로 보내기」, 아래 고정 「이 값으로 점수 보기」.
 * - 신뢰도가 낮은 칸 · 비어 있는 필수 칸은 「확인 필요」. 맞아요 · 숫자를 고치면 빠진다
 * - 「이 값으로 점수 보기」는 막는 곳(기준 → 무게 → 확인 필요 칸)이 있으면 보내지 않고 그 칸으로 내려가 위에 문장을 보인다
 * - 사진이 없으면(새로 고침 등) 3-7로 돌려보낸다
 * 값이 서로 맞지 않을 때 · kJ · 보내기 실패는 08단계 다음 순서
 */
export function CheckForm({
  reading,
  initialName,
  gtin,
  labelHref,
  nextQuery,
}: {
  reading: LabelReading;
  initialName: string;
  gtin: Gtin | null;
  /** 3-7로 돌아갈 주소(받은 값을 다시 넘긴다) */
  labelHref: string;
  /** 3-9로 넘길 값 */
  nextQuery: string;
}) {
  const router = useRouter();
  const formId = useId();
  const retake = useGoBack(labelHref);
  const photo = useSyncExternalStore(noop, getLabelPhoto, () => null);

  const [name, setName] = useState(initialName);
  const [basis, setBasis] = useState<Basis | null>(reading.basis);
  const [amount, setAmount] = useState({
    serving: reading.basis === "total" ? "" : reading.amount.value,
    total: reading.basis === "total" ? reading.amount.value : "",
  });
  const [amountUnit, setAmountUnit] = useState({
    serving: reading.amount.unit,
    total: reading.amount.unit,
  });
  const [nutrients, setNutrients] = useState(reading.nutrients);
  const [unsure, setUnsure] = useState<ReadonlySet<NutrientKey>>(
    () => new Set(reading.unsure as NutrientKey[]),
  );
  const [warn, setWarn] = useState<Blocker | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);

  const rowId = (key: string) => `${formId}-row-${key}`;
  const fieldId = (key: string) => `${formId}-field-${key}`;

  // 렌더 값이 아니라 지금 메모리를 본다(하이드레이션 첫 렌더는 서버 값 null이라 그걸로 판단하면 늘 돌려보낸다)
  useEffect(() => {
    if (!getLabelPhoto()) router.replace(labelHref);
  }, [labelHref, router]);

  const values = { basis, amount, nutrients, unsure };
  const toCheck = checkKeys(values);
  const label = (key: NutrientKey) =>
    NUTRIENTS.find((n) => n.key === key)?.label ?? key;

  const moveTo = (rowKey: string) => {
    document.getElementById(rowId(rowKey))?.scrollIntoView({ block: "center" });
    document.getElementById(fieldId(rowKey))?.focus({ preventScroll: true });
  };

  const submit = () => {
    const blocker = firstBlocker(values);
    if (!blocker) {
      // 3-9 점수 확인은 08단계 다음 순서. API 연결 때 기준 · 무게 · 단위 · 값을 보내고 받은 점수를 보인다
      router.push(`/contribute/score${nextQuery ? `?${nextQuery}` : ""}`);
      return;
    }
    // 문장 · aria-describedby가 DOM에 붙은 뒤 포커스해야 화면 읽기 프로그램이 오류를 읽고, 스크롤도 문장까지 계산한다
    flushSync(() => setWarn(blocker));
    moveTo(blocker.kind === "check" ? blocker.key : blocker.kind);
  };

  const sendPhoto = () => {
    if (gtin) addRequestedHere(gtin);
    // 메모(3-7): 사진은 확인이 끝나면 지운다
    clearLabelPhoto();
    // 4-3 내 기록(분석 요청)은 09단계. 「사진을 받았어요…」 알림은 그 화면이 `sent`를 보고 띄운다
    router.replace("/history?tab=requests&sent=photo");
  };

  const setNutrient = (key: NutrientKey, value: string) => {
    setNutrients((prev) => ({ ...prev, [key]: cleanNumber(value) }));
    // 숫자를 고치면 그 칸은 사용자가 확인한 것으로 본다
    setUnsure((prev) => without(prev, key));
    if (warn?.kind === "check" && warn.key === key) setWarn(null);
  };

  if (!photo) return null;

  const warnId = `${formId}-warn`;
  const amountKind = hasAmount(basis) ? basis : null;

  return (
    <main className="flex flex-1 flex-col bg-bg-page pt-safe pb-[calc(83px+max(var(--safe-bottom),12px))]">
      <TopBar
        title="읽은 값 확인"
        left={<BackButton fallbackHref={labelHref} />}
      />

      <div className="relative flex flex-col gap-2 pt-1 pr-28 pb-3 pl-5">
        <h2 className="text-title1 text-text-strong">
          포장의 숫자와 같은지
          <br />
          확인해 주세요
        </h2>
        <p className="text-body1 text-text-sub">
          다른 값이 있으면 그 칸을 눌러
          <br />
          고쳐 주세요.
        </p>
        <Dialog.Root open={photoOpen} onOpenChange={setPhotoOpen}>
          <Dialog.Trigger className="absolute top-2 right-5 flex flex-col items-center gap-1 text-caption text-text-sub">
            <span className="relative size-19 overflow-hidden rounded-[8px] border border-line-strong bg-bg-tint">
              <Image
                src={photo.url}
                alt=""
                fill
                unoptimized
                className="object-contain"
              />
              <ExpandMark className="absolute right-[3px] bottom-[3px]" />
            </span>
            <span>
              <span className="sr-only">찍은 사진 </span>크게 보기
            </span>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Content
              aria-describedby={undefined}
              className="fixed-app inset-y-0 z-50 flex flex-col bg-bg-dark pt-safe pb-[max(var(--safe-bottom),12px)] outline-none"
            >
              <TopBar
                tone="dark"
                right={
                  <Dialog.Close asChild>
                    <TopBarButton aria-label="닫기">
                      <IconClose />
                    </TopBarButton>
                  </Dialog.Close>
                }
              >
                <Dialog.Title className="sr-only">찍은 사진</Dialog.Title>
              </TopBar>
              {/* 메모: 크게 본 모습은 그림이 없어 화면 가득 사진만(남은 질문 46) */}
              <div className="relative min-h-0 flex-1">
                <Image
                  src={photo.url}
                  alt="찍은 영양성분표 사진"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {toCheck.length > 0 && (
        <div className="px-5 pb-2">
          <button
            type="button"
            onClick={() => moveTo(toCheck[0])}
            className="flex h-11 w-full items-center gap-2 rounded-md bg-accent-pink-weak pr-3.5 pl-4 text-left"
          >
            <span className="shrink-0 text-body2-bold text-accent-pink-text">
              확인할 곳 {toCheck.length}개
            </span>
            <span className="min-w-0 flex-1 truncate text-body2-medium text-text-strong">
              {toCheck.map(label).join(", ")}
            </span>
            <IconChevronDown
              aria-hidden
              className="size-4 shrink-0 text-accent-pink-text"
            />
          </button>
        </div>
      )}

      <div className="px-5 pb-4">
        <TextField
          label="제품 이름(선택)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          enterKeyHint="done"
          autoComplete="off"
        />
      </div>

      <div
        id={rowId("basis")}
        role="group"
        aria-labelledby={`${formId}-basis`}
        aria-describedby={warn?.kind === "basis" ? warnId : undefined}
        className="flex flex-col gap-2 px-5 py-2"
      >
        <p id={`${formId}-basis`} className="text-body2-medium text-text-body">
          포장 표 기준
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BASIS_LABEL) as Basis[]).map((b, i) => (
            <Chip
              key={b}
              id={i === 0 ? fieldId("basis") : undefined}
              // 포커스가 가는 첫 칩에서 「기준을 골라 주세요」를 읽는다
              aria-describedby={
                i === 0 && warn?.kind === "basis" ? warnId : undefined
              }
              selected={basis === b}
              // 메모: 고르지 않은 채 누르면 칩 4개에 빨간 테두리
              className={cn(warn?.kind === "basis" && "border-accent-pink")}
              onClick={() => {
                setBasis(b);
                if (warn?.kind !== "check") setWarn(null);
              }}
            >
              {BASIS_LABEL[b]}
            </Chip>
          ))}
        </div>
        {warn?.kind === "basis" && (
          <p id={warnId} className="text-body2 text-accent-pink-text">
            포장에 적힌 기준을 골라 주세요.
          </p>
        )}
      </div>

      {amountKind && (
        <div id={rowId("amount")}>
          {warn?.kind === "amount" && (
            <p
              id={warnId}
              className="px-5 pt-1.5 text-body2 text-accent-pink-text"
            >
              {amountKind === "total"
                ? "총 내용량을 적어 주세요."
                : "1회 제공량 무게를 적어 주세요."}
            </p>
          )}
          <div className="flex items-center gap-2 px-5 py-1.5">
            <span
              id={`${formId}-amount`}
              className="shrink-0 text-body1-medium text-text-strong"
            >
              {AMOUNT_LABEL[amountKind]}
            </span>
            <div
              role="group"
              aria-label="단위"
              className="flex min-w-0 flex-1 gap-1"
            >
              {(["g", "mL"] as const).map((unit) => (
                <Chip
                  key={unit}
                  selected={amountUnit[amountKind] === unit}
                  className="h-8 w-11 justify-center px-0"
                  onClick={() =>
                    setAmountUnit((prev) => ({ ...prev, [amountKind]: unit }))
                  }
                >
                  {unit}
                </Chip>
              ))}
            </div>
            <ValueField
              id={fieldId("amount")}
              value={amount[amountKind]}
              unit={amountUnit[amountKind]}
              labelledBy={`${formId}-amount`}
              describedBy={warn?.kind === "amount" ? warnId : undefined}
              flagged={warn?.kind === "amount"}
              onChange={(value) => {
                setAmount((prev) => ({
                  ...prev,
                  [amountKind]: cleanNumber(value),
                }));
                if (warn?.kind === "amount") setWarn(null);
              }}
            />
          </div>
        </div>
      )}

      {NUTRIENTS.map((n) => {
        const value = nutrients[n.key];
        const flagged = toCheck.includes(n.key);
        const blank = isBlank(value);
        const labelId = `${formId}-${n.key}`;
        const noteId = `${formId}-${n.key}-note`;
        const warned = warn?.kind === "check" && warn.key === n.key;
        return (
          <div key={n.key} id={rowId(n.key)}>
            <div aria-hidden className="mx-5 h-px bg-line-default" />
            {warned && (
              <p
                id={warnId}
                className="px-5 pt-2 text-body2 text-accent-pink-text"
              >
                &apos;확인 필요&apos; 칸을 먼저 확인해 주세요.
              </p>
            )}
            <div
              className={cn("flex flex-col gap-1.5 px-5", flagged && "pb-2")}
            >
              <div className="flex items-center gap-2 py-1.5">
                <span
                  id={labelId}
                  className="min-w-0 flex-1 text-body1-medium text-text-strong"
                >
                  {n.label}
                </span>
                {flagged && (
                  <span className="shrink-0 text-body2-medium text-accent-pink-text">
                    확인 필요
                  </span>
                )}
                <ValueField
                  id={fieldId(n.key)}
                  value={value}
                  unit={n.unit}
                  labelledBy={labelId}
                  describedBy={
                    [warned && warnId, flagged && noteId]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                  flagged={flagged}
                  onChange={(next) => setNutrient(n.key, next)}
                />
                {flagged && !blank && (
                  <button
                    type="button"
                    onClick={() => {
                      setUnsure((prev) => without(prev, n.key));
                      if (warned) setWarn(null);
                    }}
                    className="flex h-11 w-[61px] shrink-0 items-center justify-center"
                  >
                    <span className="flex h-8 w-full items-center justify-center rounded-[8px] border border-line-strong bg-bg-page text-body2-bold text-text-strong">
                      맞아요
                      <span className="sr-only">({n.label})</span>
                    </span>
                  </button>
                )}
              </div>
              {flagged && (
                <p id={noteId} className="text-body2 text-accent-pink-text">
                  {blank ? (
                    "읽지 못했어요 · 눌러서 적어 주세요"
                  ) : (
                    <>
                      흐리게 찍혔어요. 포장과 같으면 맞아요 버튼을 누르고,
                      <br />
                      다르면 숫자를 고쳐 주세요.
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex h-11 items-center justify-center pt-1">
        <button
          type="button"
          onClick={retake}
          className="flex h-11 items-center px-3 text-body2-medium text-brand-link"
        >
          사진 다시 찍기
        </button>
        <button
          type="button"
          onClick={sendPhoto}
          className="flex h-11 items-center px-3 text-body2-medium text-brand-link"
        >
          이 사진 그대로 보내기
        </button>
      </div>

      <BottomCta className="fixed-app bottom-0 z-20 border-t border-line-default">
        <Button kind="primary" className="flex-1" onClick={submit}>
          이 값으로 점수 보기
        </Button>
      </BottomCta>
    </main>
  );
}

function without<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> {
  if (!set.has(item)) return set;
  const next = new Set(set);
  next.delete(item);
  return next;
}

/** 값 칸 120×40. 누르면 숫자 키패드로 그 칸만 고친다(메모). 단위는 칸 안 숫자 뒤 */
function ValueField({
  id,
  value,
  unit,
  labelledBy,
  describedBy,
  flagged,
  onChange,
}: {
  id: string;
  value: string;
  unit: string;
  labelledBy: string;
  describedBy?: string;
  flagged: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={cn(
        "flex h-10 w-[120px] shrink-0 items-center justify-end rounded-[8px] border-[1.5px] border-transparent bg-bg-field px-3 text-body1-medium text-text-strong",
        "focus-within:border-brand-link focus-within:bg-bg-page",
        flagged && "border-accent-pink focus-within:border-accent-pink",
      )}
    >
      <input
        id={id}
        type="text"
        inputMode="decimal"
        enterKeyHint="done"
        autoComplete="off"
        value={value}
        // 단위를 이름에 넣는다(mg · g이 섞인 표라 「나트륨 mg」으로 읽혀야 한다)
        aria-labelledby={`${labelledBy} ${id}-unit`}
        aria-describedby={describedBy}
        aria-invalid={flagged || undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 bg-transparent text-right outline-none"
      />
      <span
        id={`${id}-unit`}
        aria-hidden
        className={cn(value === "" && "text-text-hint")}
      >
        {unit}
      </span>
    </label>
  );
}

/** 사진 오른쪽 아래 「크게 보기」 표시(그림의 22px 둥근 표시) */
function ExpandMark({ className }: { className?: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect width="22" height="22" rx="11" fill="#141516" fillOpacity="0.72" />
      <path
        d="M6 9.5V6H9.5M12.5 6H16V9.5M16 12.5V16H12.5M9.5 16H6V12.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="white"
      />
    </svg>
  );
}
