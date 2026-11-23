"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CircleCheckMark } from "@/components/common/check-mark";
import { ScoreRing, type ScoreBand } from "@/components/common/score-ring";
import { SectionHeader } from "@/components/common/section-header";
import { Thumb } from "@/components/common/thumb";
import { Toast } from "@/components/common/toast";
import { CompareBar } from "@/components/compare/compare-bar";
import { CompareFullSheet } from "@/components/compare/compare-full-sheet";
import {
  addToCompare,
  removeFromCompare,
  useCompare,
  type CompareItem,
} from "@/components/compare/compare-store";
import { cn } from "@/lib/utils";

import type { BetterItem } from "../../_fixtures";

type Current = CompareItem & {
  brand: string | null;
  score: number;
  band: ScoreBand;
};

/*
 * 3-4 더 맞는 제품(골라 비교)의 목록. 줄 왼쪽 동그라미로 비교함에 담고 빼며, 담으면 제자리에 그대로 있다(디자인 메모).
 * 동그라미는 여러 개(최대 4)를 고르는 것이라 의미는 체크박스다. 줄의 나머지(사진·이름)는 그 제품 3-2로 가는 링크라
 * 동그라미와 겹치지 않게 나눈다.
 */
export function PickList({
  current,
  items,
  basis,
}: {
  current: Current;
  items: readonly BetterItem[];
  /** 「다이어트 목표로, 지금 제품과 100g당 값을 비교했어요」 */
  basis: string;
}) {
  const compare = useCompare();
  const [toast, setToast] = useState<{ key: number; message: string } | null>(
    null,
  );
  // 꽉 찼을 때 담으려던 제품(3-4 비교함이 다 찼을 때 시트)
  const [pending, setPending] = useState<CompareItem | null>(null);
  const showToast = (message: string) =>
    setToast((prev) => ({ key: (prev?.key ?? 0) + 1, message }));

  const has = (id: string) => compare.some((item) => item.id === id);
  const toggle = (item: CompareItem) => {
    if (has(item.id)) {
      removeFromCompare(item.id);
      return;
    }
    if (addToCompare(item) === "full") setPending(item);
  };

  return (
    <>
      <main className="pb-[calc(57px+max(var(--safe-bottom),12px)+24px)]">
        <div className="px-5 py-2">
          <div className="flex h-28 items-center gap-3.5 rounded-lg bg-bg-band p-4">
            <PickMark
              label={`${current.name} 비교함에 담기`}
              checked={has(current.id)}
              onChange={() => toggle(current)}
            />
            <Link
              href={`/product/${current.id}`}
              className="flex min-w-0 flex-1 items-center gap-3.5"
            >
              <PickThumb src={current.image} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body2 text-text-sub">지금 보는 제품</span>
                <span className="truncate text-body1-bold text-text-strong">
                  {current.name}
                </span>
                {current.brand && (
                  <span className="truncate text-body2 text-text-sub">
                    {current.brand}
                  </span>
                )}
              </span>
              <ScoreRing score={current.score} band={current.band} size="L" />
            </Link>
          </div>
        </div>

        <SectionHeader
          title="같은 종류에서 점수가 더 높아요"
          description={
            <>
              {basis}
              <br />
              4개까지 골라 비교할 수 있어요
            </>
          }
        />
        <ul className="mx-5 border-y border-line-default">
          {items.map((item) => {
            const checked = has(item.id);
            return (
              <li
                key={item.id}
                // 담은 줄은 회색 바탕(디자인)
                className={cn(
                  "-mx-5 flex items-center gap-3 px-5 py-3",
                  checked && "bg-bg-band",
                )}
              >
                <PickMark
                  label={`${item.name} 비교함에 담기`}
                  checked={checked}
                  onChange={() =>
                    toggle({ id: item.id, name: item.name, image: item.image })
                  }
                />
                <Link
                  href={`/product/${item.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <PickThumb src={item.image} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-body2 text-text-sub">
                      {item.brand}
                    </span>
                    <span className="line-clamp-2 text-body1-medium break-keep text-text-strong">
                      {item.name}
                    </span>
                    <span className="text-body2 text-text-sub">
                      {item.diff}
                    </span>
                  </span>
                  <ScoreRing score={item.score} band={item.band} size="S" />
                </Link>
              </li>
            );
          })}
        </ul>
      </main>

      {compare.length > 0 && (
        <CompareBar
          items={compare}
          onTooFew={() => showToast("비교하려면 하나 더 담아 주세요")}
          className="bottom-0 pb-[max(var(--safe-bottom),12px)]"
        />
      )}
      <CompareFullSheet
        key={pending?.id}
        pending={pending}
        onClose={() => setPending(null)}
      />
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          // 비교함 바(57 + 아래 여백) 위 12에 띄운다(【최종】 3-2와 같은 간격). 바가 없으면 화면 아래 기준(이 화면에는 탭 바가 없다)
          className={
            compare.length > 0
              ? "bottom-[calc(69px+max(var(--safe-bottom),12px))]"
              : "bottom-[calc(max(var(--safe-bottom),12px)+12px)]"
          }
        />
      )}
    </>
  );
}

/** 줄 왼쪽 동그라미. 빈 동그라미 = 안 담음, ✓ = 담음(【최종】 디자인 메모) */
function PickMark({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex h-9 w-6 shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        aria-label={label}
        checked={checked}
        onChange={onChange}
      />
      <CircleCheckMark className="peer-focus-visible:rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-text-strong" />
    </label>
  );
}

function PickThumb({ src }: { src: string | null }) {
  return (
    <Thumb>
      <Image
        src={src ?? "/common/no-photo.png"}
        width={64}
        height={64}
        sizes="64px"
        alt=""
      />
    </Thumb>
  );
}
