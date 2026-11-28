"use client";

import { useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { RadioMark } from "@/components/common/check-mark";
import { BottomSheet } from "@/components/common/sheet";

import {
  addToCompare,
  replaceInCompare,
  useCompare,
  type CompareItem,
} from "./compare-store";

/*
 * 3-4 더 맞는 제품(비교함이 다 찼을 때). 4개인데 또 담으면 뜨는 시트. 담은 4개 중 하나를 고르면 「빼고 담기」,
 * 「닫기」·바깥·끌어 닫기는 아무것도 바꾸지 않는다(디자인 메모). 3-4 골라 비교 · 3-2 · 스캔 시트가 같이 쓴다.
 * 고르기 전에는 「빼고 담기」를 누를 수 없다(무엇을 뺄지 정해야 하는 동작이라).
 * 고른 값을 새로 시작하려고 쓰는 쪽이 key={pending.id}로 다시 그린다.
 */
export function CompareFullSheet({
  pending,
  onClose,
  onReplaced,
}: {
  /** 담으려던 제품. 있으면 시트가 열린다 */
  pending: CompareItem | null;
  onClose: () => void;
  /** 빼고 담은 뒤(시트는 이미 닫힘) */
  onReplaced?: () => void;
}) {
  const compare = useCompare();
  const [removeId, setRemoveId] = useState<string | null>(null);
  // 다른 탭에서 고른 제품이 빠졌으면 고르기 전으로 본다
  const selected = compare.some((item) => item.id === removeId)
    ? removeId
    : null;

  const replace = () => {
    if (!pending || !selected) return;
    // 그 사이 이미 담겼거나 자리가 났으면(다른 탭) 그대로 담긴 것으로 본다. 아무것도 못 담았으면 알리지 않는다
    const done =
      replaceInCompare(selected, pending) || addToCompare(pending) !== "full";
    onClose();
    if (done) onReplaced?.();
  };

  return (
    <BottomSheet
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="비교함이 다 찼어요"
      description={
        // 이 시트는 설명이 body2(디자인). 공통 시트의 body1을 덮는다
        <span className="block text-body2">
          4개까지 담을 수 있어요. 하나를 빼고 담을까요?
        </span>
      }
      footer={
        <BottomCta>
          <Button
            type="button"
            kind="secondary"
            className="flex-1"
            onClick={onClose}
          >
            닫기
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={selected === null}
            onClick={replace}
          >
            빼고 담기
          </Button>
        </BottomCta>
      }
    >
      <fieldset>
        <legend className="sr-only">뺄 제품</legend>
        {compare.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-2.5 py-3"
          >
            <input
              type="radio"
              name="compare-remove"
              className="peer sr-only"
              checked={selected === item.id}
              onChange={() => setRemoveId(item.id)}
            />
            <RadioMark
              tone="soft"
              className="peer-focus-visible:rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-text-strong"
            />
            {/* 고른 줄은 굵게(디자인) */}
            <span className="min-w-0 flex-1 truncate text-[15px] text-text-strong peer-checked:font-bold">
              {item.name}
            </span>
          </label>
        ))}
      </fieldset>
    </BottomSheet>
  );
}
