"use client";

import Link from "next/link";

import { useCompare } from "@/components/compare/compare-store";

/* 4-1 · 4-4 위 비교함 줄. 비교함에 담긴 게 있을 때만(→ 3-5 제품 비교) */
export function CompareStrip() {
  const compare = useCompare();
  if (compare.length === 0) return null;
  return (
    <Link
      href="/compare"
      className="flex items-center bg-brand-primary-weak px-5 py-2.5 text-body2"
    >
      <span className="flex-1 text-body2-medium text-text-strong">
        비교함 {compare.length}개
      </span>
      <span className="text-body2-bold text-brand-link">
        비교하기 <span aria-hidden>›</span>
      </span>
    </Link>
  );
}

/* 4-1e · 4-4e 빈 상태 아래 「다른 폰에서 쓰던 기록이 있다면 로그인 ›」(→ 5-6a 로그인) */
export function EmptyLoginLink() {
  // 로그인했는지에 따라 숨기는 건 로그인 상태를 잇는 API 작업 때(남은 질문 48)
  return (
    <Link
      href="/login"
      className="mt-8 flex h-11 items-center self-center px-5 text-body2-medium text-brand-link"
    >
      다른 폰에서 쓰던 기록이 있다면 로그인 <span aria-hidden>&nbsp;›</span>
    </Link>
  );
}
