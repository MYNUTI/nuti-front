"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/common/button";
import type { Gtin } from "@/lib/scan/types";

import { displayGtin } from "./display-gtin";

/*
 * 3-6 아직 점수가 없는 제품(【최종】 ③ 기본 9306:11596 · 이름을 아는 바코드 9306:11663) — 카메라 위 바텀시트.
 * 바코드가 어느 목록에도 없거나(기본), 식약처 바코드 목록에 이름 · 회사만 있고 영양 정보가 없을 때(이름을 아는 바코드).
 * 손잡이 · 제목 · (제품 줄) · 설명 · 바코드 번호, 「나중에 할게요」(→ 3-1) · 「영양성분표 찍고 점수 보기」(→ 3-7),
 * 글자 버튼 「제품 요청하기」(→ 3-6 제품 요청하기, 기본) 또는 「정보 수정 요청」(→ 정보가 틀렸어요 시트, 이름을 아는 바코드) ·
 * 「이름으로 찾기」(→ 2-3).
 * 찾는 중 시트처럼 사용자가 닫는 모달이 아니라 결과 자리다. 뒤에서 카메라는 계속 읽고, 다른 바코드를 읽으면 결과가 바뀐다.
 */
export function ScanNoScoreSheet({
  gtin,
  named,
  requested,
  focusOnMount,
  onLater,
  onReport,
}: {
  gtin: Gtin;
  /** 식약처 바코드 목록의 이름 · 회사. 없으면 기본 모양 */
  named: { brand: string; name: string } | null;
  /** 3-6 메모 「이럴 땐」: 다른 사람이 먼저 요청 · 이 기기에서 이미 요청 */
  requested: "others" | "mine" | null;
  /** 붙을 때 포커스를 줄 곳. 제목(번호 · 사진으로 찾았을 때) · 「정보 수정 요청」(그 시트에서 돌아왔을 때) */
  focusOnMount: "title" | "report" | null;
  onLater: () => void;
  onReport: () => void;
}) {
  const status =
    requested === "others"
      ? "먼저 요청한 분이 있었어요. 분석이 끝나면 바로 볼 수 있어요."
      : requested === "mine"
        ? "이미 요청하셨어요. 분석이 끝나면 바로 볼 수 있어요."
        : null;
  // 기본 모양의 설명. 이름을 아는 바코드는 그 자리에 제품 줄이 온다(그림)
  const description =
    status ?? (named ? null : "찾는 분이 많으면 먼저 분석해요.");
  const textButton =
    "flex h-11 items-center px-4 text-body2-bold text-brand-link";
  const title = useRef<HTMLHeadingElement>(null);
  const report = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusOnMount === "title") title.current?.focus();
    if (focusOnMount === "report") report.current?.focus();
    // 붙을 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      aria-labelledby="scan-no-score-title"
      className="fixed-app bottom-0 z-40 flex flex-col gap-4 rounded-t-sheet bg-bg-page px-5 pt-2 pb-[max(var(--safe-bottom),12px)] shadow-[0_-4px_16px_rgba(0,0,0,0.16)]"
    >
      {/* 손잡이는 모양만이다(결과 자리라 끌어 닫지 않는다. 닫기는 「나중에 할게요」) */}
      <div aria-hidden className="flex justify-center">
        <span className="h-1 w-9 rounded-[2px] bg-line-strong" />
      </div>
      <h2
        ref={title}
        id="scan-no-score-title"
        tabIndex={-1}
        className="pt-1 text-title2 text-text-strong outline-none"
      >
        아직 점수가 없는 제품이에요
      </h2>
      {named && (
        <div className="flex items-center gap-3">
          {/* 사진 칸은 늘 회색 칸에 「사진 없음」 그림(3-6 메모) */}
          <span className="size-14 shrink-0 overflow-hidden rounded-md bg-bg-band">
            <Image
              src="/common/no-photo.png"
              width={56}
              height={56}
              alt=""
              className="size-full object-cover"
            />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-caption text-text-sub">
              {named.brand}
            </span>
            <span className="truncate text-body1-bold text-text-strong">
              {named.name}
            </span>
          </span>
        </div>
      )}
      <p className="text-body2 text-text-sub">
        {description && (
          <>
            {description}
            <br />
          </>
        )}
        바코드 {displayGtin(gtin)}
      </p>
      <div className="flex gap-2">
        <Button kind="secondary" size="M" className="flex-1" onClick={onLater}>
          나중에 할게요
        </Button>
        <Button kind="primary" size="M" className="flex-1" asChild>
          <Link href={`/contribute/label?gtin=${gtin}`}>
            영양성분표 찍고 점수 보기
          </Link>
        </Button>
      </div>
      <div className="flex flex-wrap justify-center gap-1">
        {named ? (
          <button
            ref={report}
            type="button"
            onClick={onReport}
            className={textButton}
          >
            정보 수정 요청
          </button>
        ) : (
          <Link
            href={`/contribute/request?gtin=${gtin}`}
            className={textButton}
          >
            제품 요청하기
          </Link>
        )}
        <Link href="/search" className={textButton}>
          이름으로 찾기
        </Link>
      </div>
    </section>
  );
}
