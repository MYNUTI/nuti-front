"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { Notice } from "@/components/common/notice";
import {
  ProductCard,
  type ProductCardInput,
} from "@/components/common/product-card";
import { Toast } from "@/components/common/toast";
import { IconHeart, IconHeartFill } from "@/components/icons";

import { CompareStrip, EmptyLoginLink } from "./history-parts";

/*
 * 4-4 내 기록 — 즐겨찾기(【최종】 ⑧ 9306:22412 · 아직 없을 때 22493).
 * 비교함 줄, 「즐겨찾기 n개, 다이어트 목표」, 로그인 권유(로그인하지 않았을 때), 3열 사진 카드(홈 · 검색과 같은 카드,
 * ♡는 사진 오른쪽 위). 「더 맞는 제품」 줄은 없다(4-1에만).
 * - 카드 → 3-2. ♡ → 즐겨찾기 해제 — 카드가 빠지고 「즐겨찾기에서 뺐어요」 · 되돌리기(메모, 그림 없음)
 * - 0개면 「아직 즐겨찾기한 제품이 없어요」, 못 불러오면 「즐겨찾기를 불러오지 못했어요」(그림 없음). 미리 보기 `?state=empty · error`
 * 해제는 API 연결 전이라 이 화면 안에서만 바뀐다(`lib/saved` 연결 때 서버 저장).
 */
export function SavedTab({
  initialItems,
  goalLabel,
  error = false,
}: {
  initialItems: ProductCardInput[];
  goalLabel: string;
  /** 불러오지 못했을 때(그림 없음 — 4-1과 같은 공통 상태) */
  error?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [removed, setRemoved] = useState<{
    item: ProductCardInput;
    index: number;
    key: number;
  } | null>(null);
  const toastKey = useRef(0);
  const heading = useRef<HTMLParagraphElement>(null);
  const empty = useRef<HTMLDivElement>(null);
  const hearts = useRef(new Map<string, HTMLButtonElement>());

  // 마지막 카드를 빼면 개수 문장도 사라지므로 빈 상태 안내로 옮긴다
  useEffect(() => {
    if (items.length === 0 && removed) empty.current?.focus();
  }, [items.length, removed]);

  const remove = (item: ProductCardInput) => {
    const index = items.findIndex((i) => i.id === item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toastKey.current += 1;
    setRemoved({ item, index, key: toastKey.current });
    // 누른 ♡가 카드와 함께 사라지므로 늘 남는 개수 문장으로 옮긴다
    heading.current?.focus();
  };

  const undo = () => {
    if (!removed) return;
    setItems((prev) => {
      const next = [...prev];
      next.splice(Math.min(removed.index, next.length), 0, removed.item);
      return next;
    });
    // 알림 띠가 누른 버튼째 사라지니 되돌린 카드의 ♡로 포커스를 돌려놓는다(3-2 · 3-5와 같음)
    const { id } = removed.item;
    requestAnimationFrame(() => hearts.current.get(id)?.focus());
    setRemoved(null);
  };

  const toast = removed && (
    <Toast
      key={removed.key}
      message="즐겨찾기에서 뺐어요"
      action={{ label: "되돌리기", onClick: undo }}
    />
  );

  if (error)
    return (
      <ErrorState
        title="즐겨찾기를 불러오지 못했어요"
        retryKind="secondary"
        onRetry={() => router.refresh()}
      />
    );

  if (items.length === 0)
    return (
      <div ref={empty} tabIndex={-1} className="flex flex-col outline-none">
        <EmptyState
          title="아직 즐겨찾기한 제품이 없어요"
          description={
            <>
              제품 화면에서{" "}
              <IconHeart aria-hidden className="inline size-3.5 align-[-2px]" />
              <span className="sr-only">하트</span>를 누르면
              <br />
              여기에 모여요.
            </>
          }
          className="pb-0"
          actions={
            <>
              <Button size="M" asChild>
                <Link href="/scan">바코드 찍기</Link>
              </Button>
              <Button kind="tertiary" size="M" asChild>
                <Link href="/search">이름으로 찾기</Link>
              </Button>
            </>
          }
        />
        <EmptyLoginLink />
        {toast}
      </div>
    );

  return (
    <>
      <CompareStrip />
      <p
        ref={heading}
        tabIndex={-1}
        className="px-5 pt-3 pb-1 text-body2 text-text-sub outline-none"
      >
        즐겨찾기 {items.length}개, {goalLabel} 목표
      </p>
      {/* 로그인했으면 숨기는 건 로그인 상태를 잇는 API 작업 때(남은 질문 49) */}
      <div className="flex items-center gap-2 px-5 py-3">
        <Notice className="flex-1 rounded-md px-3.5">
          로그인하면 폰을 바꿔도 기록이 남아요
        </Notice>
        <Link
          href="/login"
          className="flex h-9 shrink-0 items-center px-3 text-body2-medium text-brand-link"
        >
          로그인
        </Link>
      </div>
      <ul className="grid grid-cols-3 gap-x-2.5 gap-y-5 px-5 pt-1 pb-5">
        {items.map((item) => (
          <li key={item.id} className="relative min-w-0">
            <ProductCard product={item} fluid />
            {/* 카드 링크 밖에 얹는다(링크 안에 버튼을 둘 수 없음). 사진 오른쪽 위 36 */}
            <button
              type="button"
              ref={(element) => {
                if (element) hearts.current.set(item.id, element);
                else hearts.current.delete(item.id);
              }}
              aria-label={`${item.name} 즐겨찾기 해제`}
              onClick={() => remove(item)}
              className="absolute top-px right-px flex size-9 items-center justify-center text-accent-pink [&_svg]:size-[22px]"
            >
              <IconHeartFill aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {toast}
    </>
  );
}
