"use client";

import { ConfirmSheet } from "@/components/common/sheet";

/*
 * 선택 동의(목표 계정 저장 · 몸 정보) 시트. 5-6 가입 동의와 5-5b 동의 관리가 같은 시트를 쓴다(【최종】 메모).
 * 법이 알리라고 정한 4가지(항목 · 목적 · 보관 · 거부)를 보여 주고 「동의하기」를 눌러야 켜진다. 미리 켜 두지 않는다.
 * 「취소」 · 바깥 → 꺼진 채 닫힌다.
 */

/** 알릴 4가지 상자. 굵게 할 낱말(민감정보 · 보관 기간)은 쓰는 쪽이 <b>로 넘긴다(법이 눈에 띄게 알리라고 정한 내용) */
function ConsentFacts({
  rows,
}: {
  rows: { label: string; body: React.ReactNode }[];
}) {
  return (
    <dl className="flex flex-col gap-2.5 rounded-md bg-bg-field px-4 py-3.5 text-[14px] leading-[1.5] break-keep">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-2.5">
          <dt className="shrink-0 font-bold text-brand-link">{row.label}</dt>
          <dd className="min-w-0 flex-1 font-medium text-text-strong [&_b]:font-bold">
            {row.body}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SensitiveNote() {
  return (
    <p className="text-[13px] leading-5 text-text-sub">
      민감정보는 건강처럼 법이 더 엄격하게 보호하는 정보예요.
    </p>
  );
}

const KEEP = (
  <>
    계정에 저장하고, <b>지우거나 철회할 때까지</b>
    <br />
    보관합니다
  </>
);

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
};

/** 목표 계정 저장. goalLabel이 없으면(기기에 목표가 없음) 목표 이름 없이 쓴다 */
export function GoalSaveConsentSheet({
  goalLabel,
  ...props
}: SheetProps & { goalLabel?: string }) {
  return (
    <ConfirmSheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      dismissible
      title="고른 목표를 계정에도 저장할까요?"
      cancelLabel="취소"
      confirmLabel="동의하기"
      onConfirm={props.onAgree}
    >
      <ConsentFacts
        rows={[
          {
            label: "항목",
            body: goalLabel ? (
              <>
                고른 목표: <b>{goalLabel}(민감정보)</b>
              </>
            ) : (
              <b>고른 목표(민감정보)</b>
            ),
          },
          {
            label: "목적",
            body: (
              <>
                계정에 저장해 다른 기기에서도 같은 목표로
                <br />
                점수를 봅니다
              </>
            ),
          },
          { label: "보관", body: KEEP },
          {
            label: "거부",
            body: (
              <>
                동의하지 않을 수 있습니다.
                <br />
                동의하지 않아도 이 기기에서는 고른 목표로
                <br />
                점수를 봅니다. 계정에 저장되지 않아
                <br />
                다른 기기에서는 이어지지 않습니다.
              </>
            ),
          },
        ]}
      />
      <SensitiveNote />
    </ConfirmSheet>
  );
}

/** 몸 정보 수집 · 이용(민감정보) */
export function BodyConsentSheet(props: SheetProps) {
  return (
    <ConfirmSheet
      open={props.open}
      onOpenChange={props.onOpenChange}
      dismissible
      title="몸 정보로 점수를 맞출까요?"
      description={
        "동의하면 하루 필요 칼로리를 계산해\n다이어트 점수를 맞추고 계정에 저장해요."
      }
      cancelLabel="취소"
      confirmLabel="동의하기"
      onConfirm={props.onAgree}
    >
      <ConsentFacts
        rows={[
          {
            label: "항목",
            body: (
              <span className="font-normal">
                성별, 출생 연도, <b>키, 체중(민감정보)</b>, 활동량,
                <br />
                계산한 하루 필요 칼로리
              </span>
            ),
          },
          {
            label: "목적",
            body: (
              <>
                내 몸에 맞춘 다이어트 점수 계산,
                <br />
                계정에 저장해 다른 기기에서도 이어 보기
              </>
            ),
          },
          { label: "보관", body: KEEP },
          {
            label: "거부",
            body: (
              <>
                동의하지 않을 수 있습니다.
                <br />
                동의하지 않아도 스캔, 점수, 비교는
                <br />
                그대로 쓸 수 있고, 점수는
                <br />
                <b>기본(하루 2,000kcal 기준)</b>으로 계산합니다.
              </>
            ),
          },
        ]}
      />
      <SensitiveNote />
    </ConfirmSheet>
  );
}
