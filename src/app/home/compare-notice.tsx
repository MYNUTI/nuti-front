"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCompare } from "@/components/compare/compare-store";
import { IconClose } from "@/components/icons";

import {
  type CompareNotice as Notice,
  compareNotice,
} from "./compare-notice-rules";

/*
 * 2-1 홈 「담아 둔 비교함」 안내 줄(【최종】 2-1 홈(담아 둔 비교함이 있을 때)).
 * 줄 전체 → 3-5 제품 비교, ✕ → 이 줄만 숨김(비교함은 그대로). 언제 띄우는지는 compare-notice-rules.
 * 띄운 시각은 띄우자마자 브라우저에 적는다. 화면을 연 때 읽은 값으로 정하므로 떠 있는 동안은 그대로이고,
 * 다음에 홈을 열면 적어 둔 값으로 다시 정한다.
 */
const SEEN_KEY = "nuti_compare_notice_v2";

// 저장이 막힌 브라우저(사생활 보호 모드 등)는 이번에 연 동안만 기억한다
let memorySeen: number | null = null;

function readSeen(): number | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw === null ? memorySeen : Number(raw);
  } catch {
    return memorySeen;
  }
}

function writeSeen(at: number) {
  memorySeen = at;
  try {
    localStorage.setItem(SEEN_KEY, String(at));
  } catch {
    // memorySeen만 쓴다
  }
}

// 줄이 사라지면 누른 ✕도 사라지니 다음 구역(종류)의 첫 칸으로 포커스를 옮긴다
function focusNext() {
  requestAnimationFrame(() =>
    document
      .getElementById("home-category")
      ?.querySelector<HTMLElement>("a")
      ?.focus(),
  );
}

export function CompareNotice() {
  const items = useCompare();
  // 서버 · 하이드레이션 중에는 비교함이 비어 있어 안내가 늘 없으므로, 이 값이 서버와 달라도 그림이 어긋나지 않는다
  const [seen] = useState(readSeen);
  const [now] = useState(() => Date.now());
  const [closed, setClosed] = useState(false);
  const notice = closed ? null : compareNotice(items, now, seen);
  const shown = notice !== null;

  useEffect(() => {
    if (shown) writeSeen(now);
  }, [shown, now]);

  if (!notice) return null;
  return (
    <CompareNoticeView
      notice={notice}
      onClose={() => {
        setClosed(true);
        focusNext();
      }}
    />
  );
}

/** 「?state=compare」 미리 보기. 디자인 값으로 늘 띄우고 ✕로 숨긴다 */
export function CompareNoticePreview({ notice }: { notice: Notice }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;
  return (
    <CompareNoticeView
      notice={notice}
      onClose={() => {
        setClosed(true);
        focusNext();
      }}
    />
  );
}

function CompareNoticeView({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  return (
    <div className="px-5 pb-3">
      <div className="flex items-start rounded-md bg-bg-field">
        <Link
          href="/compare"
          className="flex min-w-0 flex-1 items-start gap-2 py-3 pl-4 break-keep"
        >
          <span className="text-body2-medium text-text-strong">
            {notice.addedLabel} 담은 {notice.count}개가 비교함에 남아 있어요
          </span>
          <span className="flex h-5 shrink-0 items-center rounded-md bg-brand-primary-weak px-3 text-body2-medium text-brand-link">
            비교하기
          </span>
        </Link>
        <button
          type="button"
          aria-label="비교함 안내 닫기"
          onClick={onClose}
          className="flex size-11 shrink-0 items-center justify-center text-icon-default"
        >
          <IconClose className="size-4" />
        </button>
      </div>
    </div>
  );
}
