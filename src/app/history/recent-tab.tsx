"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import {
  SCORE_BAND_LABEL,
  ScoreRing,
  type ScoreBand,
} from "@/components/common/score-ring";
import { SortSheet } from "@/components/common/sort-sheet";
import { StatusTag } from "@/components/common/status-tag";
import { Thumb } from "@/components/common/thumb";
import { useCompare } from "@/components/compare/compare-store";
import {
  IconChevronDown,
  IconClose,
  IconHeart,
  IconHeartFill,
} from "@/components/icons";
import { cn } from "@/lib/utils";

import type { HistoryItem } from "./_fixtures";

const DOT: Record<ScoreBand, string> = {
  1: "bg-score-ring-1",
  2: "bg-score-ring-2",
  3: "bg-score-ring-3",
  4: "bg-score-ring-4",
  5: "bg-score-ring-5",
};

// 「점수가 중간인 제품 n개」(메모)처럼 문장에 넣을 꼴
const BAND_PHRASE: Record<ScoreBand, string> = {
  1: "매우 높은",
  2: "높은",
  3: "중간인",
  4: "낮은",
  5: "매우 낮은",
};

const BAND_OPTIONS = [
  { value: "all", label: "전체" },
  ...([1, 2, 3, 4, 5] as const).map((band) => ({
    value: String(band),
    label: SCORE_BAND_LABEL[band],
    mark: (
      <span aria-hidden className={cn("size-2.5 rounded-full", DOT[band])} />
    ),
  })),
];

/*
 * 4-1 내 기록 — 최근 본 제품(【최종】 ⑧ 9306:22370 · 점수 고르기 22735 · 점수로 거를 때 22608 · 아직 없을 때 22477).
 * 비교함 줄(담긴 게 있을 때 → 3-5), 「최근 본 제품 n개, 다이어트 목표」 + 「점수: 전체 ▾」(→ 점수별로 보기 시트),
 * 날짜별 줄(사진 · 브랜드 · 이름 · 점수 링 또는 「점수 없음」 · ♡).
 * - 줄 → 3-2(점수 없음은 3-6 전체 화면). 중간 이하 줄 아래 「더 맞는 제품 n개 ›」(→ 3-4), 점수 없음 줄 아래
 *   「영양성분표 찍고 점수 보기 ›」(→ 3-7)
 * - 구간을 고르면 그 구간만(점수 없음은 빠짐), 버튼이 「점수: 중간 ✕」 — 글자는 시트, ✕는 전체로
 * - 거른 결과가 0개면 「점수가 중간인 제품 0개」와 「전체 보기」(메모, 그림 없음)
 * ♡는 API 연결 전이라 이 화면에서만 바뀐다(즐겨찾기 API는 `lib/saved`에 있음 — API 작업 브랜치에서 잇는다).
 */
export function RecentTab({
  state,
  band,
  count,
  groups,
  goalLabel,
  initialSaved,
}: {
  state: "ok" | "empty" | "error";
  band: ScoreBand | null;
  /** 거른 뒤 개수(메모: 서로 다른 제품 수) */
  count: number;
  groups: { day: string; label: string; items: HistoryItem[] }[];
  goalLabel: string;
  initialSaved: string[];
}) {
  const router = useRouter();
  const compare = useCompare();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saved, setSaved] = useState(() => new Set(initialSaved));
  const trigger = useRef<HTMLButtonElement>(null);
  // 구간을 바꾼 뒤에만 개수 문장을 알린다(처음 열 때는 읽지 않음)
  const [announce, setAnnounce] = useState(false);

  const selectBand = (value: string) => {
    // ✕ · 「전체 보기」는 누른 버튼이 사라지므로 늘 남는 「점수:」 버튼으로 옮긴다
    trigger.current?.focus();
    setAnnounce(true);
    router.replace(value === "all" ? "/history" : `/history?band=${value}`, {
      scroll: false,
    });
  };

  if (state === "error")
    return (
      <ErrorState
        title="기록을 불러오지 못했어요"
        retryKind="secondary"
        onRetry={() => router.refresh()}
      />
    );

  if (state === "empty")
    return (
      <div className="flex flex-col items-center">
        <EmptyState
          title="아직 본 제품이 없어요"
          description={"찍거나 찾아본 제품이\n여기에 날짜별로 모여요."}
          className="w-full pb-0"
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
        {/* 로그인했는지에 따라 숨기는 건 로그인 상태를 잇는 API 작업 때(남은 질문 48) */}
        <Link
          href="/login"
          className="mt-8 flex h-11 items-center px-5 text-body2-medium text-brand-link"
        >
          다른 폰에서 쓰던 기록이 있다면 로그인 ›
        </Link>
      </div>
    );

  const summary = `${
    band
      ? `점수가 ${BAND_PHRASE[band]} 제품 ${count}개`
      : `최근 본 제품 ${count}개`
  }, ${goalLabel} 목표`;

  return (
    <>
      {compare.length > 0 && (
        <Link
          href="/compare"
          className="flex items-center bg-brand-primary-weak px-5 py-2.5 text-body2"
        >
          <span className="flex-1 text-body2-medium text-text-strong">
            비교함 {compare.length}개
          </span>
          <span className="text-body2-bold text-brand-link">비교하기 ›</span>
        </Link>
      )}

      <div className="flex h-11 items-center justify-between pt-3 pr-2 pb-1 pl-5">
        <p className="text-body2 text-text-sub">{summary}</p>
        <p role="status" className="sr-only">
          {announce ? summary : ""}
        </p>
        <div className="flex items-center">
          <button
            type="button"
            ref={trigger}
            aria-haspopup="dialog"
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex h-11 items-center gap-0.5 text-body2-medium text-text-strong",
              band ? "pl-2" : "pl-2 [&_svg]:size-4",
            )}
          >
            점수: {band ? SCORE_BAND_LABEL[band] : "전체"}
            {!band && <IconChevronDown aria-hidden />}
          </button>
          {band && (
            <button
              type="button"
              aria-label="점수 거르기 지우기"
              onClick={() => selectBand("all")}
              className="flex size-11 items-center justify-center [&_svg]:size-4"
            >
              <IconClose aria-hidden />
            </button>
          )}
        </div>
      </div>

      {count === 0 && band && (
        <div className="flex justify-center px-5 py-10">
          <Button kind="tertiary" size="M" onClick={() => selectBand("all")}>
            전체 보기
          </Button>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.day} aria-labelledby={`day-${group.day}`}>
          <h2
            id={`day-${group.day}`}
            className="px-5 pt-2 pb-1 text-body2-medium text-text-sub"
          >
            {group.label}
          </h2>
          <ul>
            {group.items.map((item, i) => (
              <li key={item.id}>
                {i > 0 && (
                  <div aria-hidden className="mx-5 h-px bg-line-default" />
                )}
                <HistoryRow
                  item={item}
                  saved={saved.has(item.id)}
                  onToggleSave={() =>
                    setSaved((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <SortSheet
        title="점수별로 보기"
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        options={BAND_OPTIONS}
        value={band ? String(band) : "all"}
        onSelect={selectBand}
      />
    </>
  );
}

/*
 * 기록 한 줄. 줄 전체가 3-2 링크이고, 아래 글자 링크 · ♡는 그 위에 얹는다(링크 안에 링크를 둘 수 없어 줄 링크를
 * 줄 전체로 늘린다)
 */
function HistoryRow({
  item,
  saved,
  onToggleSave,
}: {
  item: HistoryItem;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="relative flex items-center pr-3">
      <div className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-1 pl-5">
        <Thumb>
          {item.image && (
            <Image
              src={item.image}
              width={128}
              height={128}
              sizes="64px"
              alt=""
            />
          )}
        </Thumb>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {item.brand && (
            <span className="text-body2 text-text-sub">{item.brand}</span>
          )}
          <Link
            href={item.href}
            className="line-clamp-2 text-body1-medium text-text-strong after:absolute after:inset-0"
          >
            {item.name}
          </Link>
          {item.more && (
            <Link
              href={item.more.href}
              className={cn(
                "relative z-10 self-start text-body2",
                item.score ? "text-brand-link" : "text-text-sub",
              )}
            >
              {item.more.label} <span aria-hidden>›</span>
            </Link>
          )}
        </div>
        {item.score ? (
          <ScoreRing score={item.score.value} band={item.score.band} size="S" />
        ) : (
          <StatusTag status="noScore" />
        )}
      </div>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={`${item.name} 즐겨찾기`}
        onClick={onToggleSave}
        className="relative z-10 flex size-11 shrink-0 items-center justify-center [&_svg]:size-6"
      >
        {saved ? (
          <IconHeartFill aria-hidden className="text-accent-pink" />
        ) : (
          <IconHeart aria-hidden className="text-icon-default" />
        )}
      </button>
    </div>
  );
}
