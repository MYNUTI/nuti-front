"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/common/button";
import { SCORE_BAND_LABEL, ScoreRing } from "@/components/common/score-ring";
import { ConfirmSheet } from "@/components/common/sheet";
import { Thumb } from "@/components/common/thumb";
import { Toast } from "@/components/common/toast";
import {
  COMPARE_MAX,
  clearCompare,
  removeFromCompare,
  useCompare,
} from "@/components/compare/compare-store";
import { cn } from "@/lib/utils";

import {
  findCompareProduct,
  type CompareProduct,
  type CompareRowKey,
} from "./_fixtures";
import {
  bestIds,
  betterDirection,
  byScore,
  formatValue,
  roundValue,
} from "./compare-rules";

/** 표 줄. scored = 점수에 쓰는 성분(굵게 고르는 줄). 탄수화물·지방은 점수에 쓰지 않아 굵게 하지 않는다(【최종】 메모) */
const ROWS: {
  key: CompareRowKey;
  label: string;
  unit: "kcal" | "g" | "mg";
  scored: boolean;
}[] = [
  { key: "calories", label: "칼로리", unit: "kcal", scored: true },
  { key: "protein", label: "단백질", unit: "g", scored: true },
  { key: "carbohydrate", label: "탄수화물", unit: "g", scored: false },
  { key: "sugar", label: "당류", unit: "g", scored: true },
  { key: "fat", label: "지방", unit: "g", scored: false },
  { key: "sodium", label: "나트륨", unit: "mg", scored: true },
];

// 비교 기준 목표. 사용자 목표(설정)를 읽는 곳이 아직 없어 디자인 그림의 다이어트로 둔다(API 연결 때 사용자 목표로)
const GOAL = "diet";

const noSubscribe = () => () => undefined;

/*
 * 3-5 제품 비교 표(【최종】 ⑤). 열 = 비교함에 담은 제품(점수가 가장 높은 제품이 첫 열), 행 = 점수 · 영양성분(100g당).
 * 행 이름 열은 고정이고 제품 열은 폭 148(3개 이상이면 132), 넘치면 옆으로 민다. 끝 열은 늘 「+ 제품 추가」(열 전체를 누름).
 * 점수 줄은 화면 폭 회색 바탕 + 링 아래 구간 이름. 점수에 쓰는 줄에서 목표에 더 맞는 값만 굵게. 열 강조 색은 없다.
 */
export function CompareTable() {
  const router = useRouter();
  const compare = useCompare();
  // 서버 렌더에서는 비교함을 못 읽는다. 브라우저 값을 읽은 뒤에만 빈 비교함을 판단한다
  const client = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const products = byScore(
    compare
      .map((item) => findCompareProduct(item.id))
      .filter((p): p is CompareProduct => p !== null),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ key: number; message: string } | null>(
    null,
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ start: 0, size: 1 });

  // 표 폭이 바뀌면(열을 빼거나 화면을 돌림) 스크롤 표시를 다시 잰다
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () =>
      setScroll({
        start: el.scrollLeft / el.scrollWidth,
        size: el.clientWidth / el.scrollWidth,
      });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => observer.disconnect();
  }, [products.length]);

  const empty = client && products.length === 0;
  // 비우기로 비었을 때는 들어온 화면으로 가는 중이라 홈으로 보내지 않는다
  const leaving = useRef(false);
  useEffect(() => {
    // 빈 비교함은 디자인에 없다. 담은 게 없으면 홈으로 보낸다(UI 플랜 「남은 질문」 20)
    if (empty && !leaving.current) router.replace("/home");
  }, [empty, router]);

  // 「제외하기」를 누르면 그 버튼이 열과 함께 사라진다. 옆 열의 「제외하기」로 포커스를 옮긴다
  const removeRefs = useRef(new Map<string, HTMLButtonElement>());
  const remove = (id: string) => {
    const index = products.findIndex((p) => p.id === id);
    const next = products[index + 1] ?? products[index - 1];
    removeFromCompare(id);
    if (next)
      requestAnimationFrame(() => removeRefs.current.get(next.id)?.focus());
  };

  const leave = () => {
    // 디자인 메모(비우기 확인): 비우면 3-5에 들어오기 전 화면으로
    if (window.history.length > 1) router.back();
    else router.replace("/home");
  };

  // g 제품과 mL 제품이 섞이면 같은 줄을 견줄 수 없어 굵게를 끄고 열마다 기준을 적는다(디자인에 없음, 「남은 질문」 21)
  const units = new Set(products.map((p) => p.unit));
  const mixed = units.size > 1;
  const basis = mixed ? "100g·100mL당" : `100${products[0]?.unit ?? "g"}당`;
  const best = Object.fromEntries(
    ROWS.map((row) => [
      row.key,
      row.scored && !mixed
        ? bestIds(
            products.map((p) => {
              const value = p.per100[row.key];
              return {
                id: p.id,
                value: value === null ? null : roundValue(value, row.unit),
              };
            }),
            betterDirection(row.key, GOAL),
          )
        : new Set<string>(),
    ]),
  ) as Record<CompareRowKey, ReadonlySet<string>>;
  // 【최종】 메모: 제품이 3개 이상이면 열 폭을 132로 줄인다
  const column = products.length >= 3 ? "w-[132px]" : "w-[148px]";
  const full = compare.length >= COMPARE_MAX;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 pr-5 pl-3">
        <button
          type="button"
          className="flex h-11 shrink-0 items-center px-4 text-body2-bold text-text-sub"
          onClick={() => setConfirmOpen(true)}
        >
          비교함 비우기
        </button>
        <p className="min-w-0 flex-1 text-right text-caption text-text-sub">
          굵은 글씨: 목표에 더 맞는 값({basis})
          <br />
          탄수화물과 지방은 점수에 넣지 않아요
        </p>
      </div>

      <div
        className="flex [scrollbar-width:none] overflow-x-auto"
        ref={scrollerRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          setScroll({
            start: el.scrollLeft / el.scrollWidth,
            size: el.clientWidth / el.scrollWidth,
          });
        }}
      >
        {/* 행 이름 열. 옆으로 밀어도 왼쪽에 남는다 */}
        <div className="sticky left-0 z-10 w-[90px] shrink-0 bg-bg-page">
          <div className="flex h-48 items-end border-b border-line-default pb-3 pl-7 text-body2 text-text-sub">
            {basis}
          </div>
          <div className="flex h-20 items-center border-b border-line-default bg-bg-band pl-4 text-body2 text-text-sub">
            점수
          </div>
          {ROWS.map((row) => (
            <div
              key={row.key}
              className="ml-4 flex h-13 items-center border-b border-line-default text-body2 text-text-sub"
            >
              {row.label}
            </div>
          ))}
          <div className="h-[54px]" />
        </div>

        {products.map((p) => (
          <section
            key={p.id}
            aria-label={p.name}
            className={cn("shrink-0", column)}
          >
            <Link
              href={`/product/${p.id}`}
              className="flex h-48 flex-col items-center gap-1.5 border-b border-line-default px-2.5 pt-2.5"
            >
              {/* 꼬리표 자리. 단위가 섞였을 때만 이 열의 기준을 적는다 */}
              <span className="h-5 text-caption text-text-sub">
                {mixed && `100${p.unit}당`}
              </span>
              <Thumb>
                <ComparePhoto key={p.image} src={p.image} />
              </Thumb>
              {p.brand && (
                <span className="w-full truncate text-center text-[12px] leading-5 text-text-sub">
                  {p.brand}
                </span>
              )}
              <span className="line-clamp-2 w-full text-center text-body2-medium break-keep text-text-strong">
                {p.name}
              </span>
            </Link>
            <div className="flex h-20 flex-col items-center justify-center gap-1 border-b border-line-default bg-bg-band">
              <ScoreRing score={p.score} band={p.band} size="M" />
              <span className="text-caption-bold text-text-strong">
                {SCORE_BAND_LABEL[p.band]}
              </span>
            </div>
            {ROWS.map((row) => {
              const value = p.per100[row.key];
              return (
                <div
                  key={row.key}
                  className="flex h-13 items-center justify-center border-b border-line-default px-1.5"
                >
                  {value === null ? (
                    // 디자인 메모: 값이 없는 칸은 회색 「표시 없음」
                    <span className="text-body2 text-text-disabled">
                      {/* 열 단위로 그려 화면 읽기가 줄 이름을 모르니 칸마다 붙인다 */}
                      <span className="sr-only">{row.label} </span>
                      표시 없음
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-body1",
                        best[row.key].has(p.id)
                          ? "font-bold text-text-strong"
                          : "text-text-body",
                      )}
                    >
                      <span className="sr-only">{row.label} </span>
                      {formatValue(value, row.unit)}
                      {best[row.key].has(p.id) && (
                        <span className="sr-only">, 목표에 더 맞음</span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
            <div className="flex h-[54px] items-center justify-center">
              <Button
                type="button"
                kind="tertiary"
                size="S"
                aria-label={`${p.name} 제외하기`}
                ref={(el) => {
                  if (el) removeRefs.current.set(p.id, el);
                  else removeRefs.current.delete(p.id);
                }}
                onClick={() => remove(p.id)}
              >
                제외하기
              </Button>
            </div>
          </section>
        ))}

        {/* 끝 열 「+ 제품 추가」(열 전체를 누름). 점수 줄 회색 바탕은 이 열까지 잇는다 */}
        <AddColumn
          className={column}
          full={full}
          onFull={() =>
            setToast((prev) => ({
              key: (prev?.key ?? 0) + 1,
              message: "4개가 다 찼어요. 하나를 제외하면 더 담을 수 있어요",
            }))
          }
        />
      </div>

      {/* 가로 스크롤 표시(옆에 더 있음). 【최종】 메모: 제품이 2개일 때도 늘 둔다 */}
      <div aria-hidden className="px-5 pt-2">
        <div className="relative h-[3px] overflow-hidden rounded-full bg-line-default">
          <div
            className="absolute inset-y-0 rounded-full bg-icon-sub"
            style={{
              left: `${scroll.start * 100}%`,
              width: `${scroll.size * 100}%`,
            }}
          />
        </div>
      </div>

      <ConfirmSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        dismissible
        // 표에 보이는 열 수로 센다(찾지 못한 제품은 열이 없다)
        title={`담아 둔 ${products.length}개를 비울까요?`}
        cancelLabel="그대로 두기"
        confirmLabel="비우기"
        onConfirm={() => {
          leaving.current = true;
          clearCompare();
          leave();
        }}
      />
      {toast && <Toast key={toast.key} message={toast.message} />}
    </main>
  );
}

/*
 * 「+ 제품 추가」 열. 디자인 메모(MVP): → 2-2 점수 순위(담긴 제품의 중분류를 고른 채로 여는 주소는 07단계에서 정한다).
 * 4개가 찼으면 이동하지 않고 알림만.
 */
function AddColumn({
  className,
  full,
  onFull,
}: {
  className: string;
  full: boolean;
  onFull: () => void;
}) {
  const layout = (
    <>
      <span aria-hidden className="block h-48 border-b border-line-default" />
      <span
        aria-hidden
        className="block h-20 border-b border-line-default bg-bg-band"
      />
      <span className="absolute inset-0 flex items-center justify-center text-body1-bold text-brand-link">
        + 제품 추가
      </span>
    </>
  );
  const columnClass = cn("relative block shrink-0 self-stretch", className);

  return full ? (
    <button type="button" className={columnClass} onClick={onFull}>
      {layout}
    </button>
  ) : (
    <Link href="/ranking" className={columnClass}>
      {layout}
    </Link>
  );
}

/** 열 머리 사진. 사진이 없거나 주소가 깨지면 3-2 「사진이 없을 때」 그림(작은 칸은 글 없이) */
function ComparePhoto({ src }: { src: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken)
    return (
      <Image
        src="/common/no-photo.png"
        width={64}
        height={64}
        sizes="64px"
        alt=""
      />
    );
  return (
    // 서버 사진 주소라 next/image 허용 도메인을 정하기 전까지 img로 둔다
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" onError={() => setBroken(true)} />
  );
}
