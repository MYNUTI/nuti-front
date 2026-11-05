import Image from "next/image";
import Link from "next/link";

import {
  SCORE_BAND_LABEL,
  type ScoreBand,
} from "@/components/common/score-ring";
import { Skeleton } from "@/components/common/skeleton";
import { cn } from "@/lib/utils";

import type { Goal, RecentSummary } from "./_fixtures";

/*
 * 2-1 홈의 내 목표 카드. 틀(바탕·사람 그림·목표 제목)은 같고 안쪽만 상태에 따라 바뀐다.
 *   첫 방문: 최근 본 제품이 없을 때 · 사용 중: 1개 이상일 때 · 로그인 안 함: 1개 이상인데 로그인 전
 *   불러오는 중: 숫자 자리만 회색 막대
 */

// 디자인(카드 폭 370): 200×150, 왼쪽 203, 카드 아래에서 26 위. 첫 방문·사용 중 같음
const DIET_IMAGE_CLASS =
  "bottom-[26px] left-[54.86%] aspect-[4/3] w-[54.05%] object-cover";

const GOAL_CARD = {
  diet: {
    title: "다이어트 목표로 보고 있어요",
    image: { src: "/home/goal-diet.png", width: 1446, height: 1087 },
    imageClass: { prompt: DIET_IMAGE_CLASS, using: DIET_IMAGE_CLASS },
  },
  muscle: {
    title: "근육 증가 목표로 보고 있어요",
    image: { src: "/home/goal-muscle.png", width: 1358, height: 1159 },
    imageClass: {
      // 디자인(카드 폭 370): 248×192, 왼쪽 175, 카드 아래에 붙음
      prompt:
        "bottom-px left-[47.3%] aspect-[248/192] w-[67.03%] object-cover object-top",
      // 디자인: 236×179, 왼쪽 191, 틀 안에서 11 내려 그리고 아래 11은 잘림(카드 아래에서 14 위까지 보임)
      using:
        "bottom-[3px] left-[51.62%] aspect-[236/179] w-[63.78%] object-cover object-top [clip-path:inset(0_0_6.15%_0)]",
    },
  },
} as const;

function GoalCard({
  goal,
  layout,
  footer,
  children,
}: {
  goal: Goal;
  /** 사람 그림 자리. 근육 증가는 첫 방문 모양과 사용 중 모양에서 그림 위치가 다르다 */
  layout: "prompt" | "using";
  /** 카드 바로 아래 줄 */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const card = GOAL_CARD[goal];

  return (
    <div className="px-4 pt-1 pb-4">
      <div className="@container relative h-[205px] overflow-hidden rounded-lg bg-gradient-to-r from-[rgba(229,245,254,0.6)] to-[rgba(205,223,254,0.6)]">
        <Image
          src={card.image.src}
          width={card.image.width}
          height={card.image.height}
          sizes="260px"
          alt=""
          loading="eager"
          fetchPriority="high"
          // 카드 폭에 비례해 커지고 줄도록 위치·크기를 디자인 비율(%)로 둔다
          className={cn(
            "absolute h-auto max-w-none opacity-90",
            card.imageClass[layout],
          )}
        />
        <div className="absolute top-[18px] left-[18px] flex flex-col items-start">
          {/* 디자인은 「›」만 있고 갈 곳이 메모에 없다. 목표를 바꾸는 5-2로 걸어 둔다 */}
          <Link
            href="/my/goal"
            className="text-[15px] leading-[22px] font-bold text-text-strong"
          >
            {card.title} <span aria-hidden>›</span>
          </Link>
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
}

/** 첫 방문·로그인 안 함 카드의 같은 모양: 안내 한 줄, 설명 두 줄, 흰 알약 버튼 */
function GoalCardPrompt({
  goal,
  heading,
  body,
  action,
  footer,
}: {
  goal: Goal;
  heading: string;
  body: React.ReactNode;
  action: { href: string; label: string };
  footer?: React.ReactNode;
}) {
  return (
    <GoalCard goal={goal} layout="prompt" footer={footer}>
      <p className="mt-3.5 text-[14px] leading-5 font-medium text-text-strong">
        {heading}
      </p>
      <p className="mt-1 text-[12px] leading-[18px] text-text-body">{body}</p>
      <Link
        href={action.href}
        className="mt-4 rounded-full bg-bg-page px-3.5 py-2 text-[13px] leading-[18px] font-bold text-brand-link"
      >
        {action.label}
      </Link>
    </GoalCard>
  );
}

/**
 * 첫 방문: 최근 본 제품이 없을 때.
 * 11-05 회의: 로그인하지 않았으면 카드 아래 로그인 권유 줄을 둔다(계정 삭제 뒤 홈에는 없음)
 */
export function GoalCardEmpty({
  goal,
  loginPrompt = false,
}: {
  goal: Goal;
  loginPrompt?: boolean;
}) {
  return (
    <GoalCardPrompt
      goal={goal}
      footer={loginPrompt && <LoginPromptRow />}
      heading="최근 본 제품이 아직 없어요"
      body={
        <>
          바코드를 찍으면 점수와 함께
          <br />
          여기에 기록이 쌓여요.
        </>
      }
      action={{ href: "/scan", label: "바코드 찍어 보기" }}
    />
  );
}

function LoginPromptRow() {
  return (
    <div className="mt-2.5 flex items-center gap-2 rounded-md bg-bg-band px-3.5 py-3 text-[13px] leading-[18px]">
      <p className="min-w-0 flex-1 text-text-body">
        로그인하면 폰을 바꿔도 기록이 남아요
      </p>
      <Link href="/login" className="shrink-0 font-bold text-brand-link">
        로그인 <span aria-hidden>›</span>
      </Link>
    </div>
  );
}

/**
 * 로그인 안 함: 최근 본 제품이 1개 이상일 때(0개면 첫 방문 카드).
 * 11-05 회의: 기록 숫자·막대·분석 요청은 로그인한 사람 카드에만 두고, 카드 아래 로그인 권유 줄은 숨긴다.
 */
export function GoalCardGuest({ goal }: { goal: Goal }) {
  return (
    <GoalCardPrompt
      goal={goal}
      heading="로그인하면 기록이 계속 남아요"
      body={
        <>
          폰을 바꿔도 본 제품과
          <br />
          점수를 그대로 볼 수 있어요.
        </>
      }
      action={{ href: "/login", label: "로그인하기" }}
    />
  );
}

const BAND_COLOR: Record<ScoreBand, string> = {
  1: "bg-score-ring-1",
  2: "bg-score-ring-2",
  3: "bg-score-ring-3",
  4: "bg-score-ring-4",
  5: "bg-score-ring-5",
};

const BANDS = [1, 2, 3, 4, 5] as const;

/**
 * 사용 중: 최근 본 제품 수(가장 크게), 목표에 맞는 제품 수, 점수 구간 막대(범례 없음).
 * summary가 없으면 숫자를 불러오는 중이라 숫자 자리만 회색 막대로 그린다.
 */
export function GoalCardUsing({
  goal,
  summary,
}: {
  goal: Goal;
  summary?: RecentSummary;
}) {
  return (
    <GoalCard goal={goal} layout="using">
      {/* 라이브 영역은 늘 두고 안쪽만 바꾼다. 나중에 생긴 영역은 화면 읽기 프로그램이 읽지 않는다(LoadingState와 같은 이유) */}
      <span role="status" className="sr-only">
        {summary ? null : "불러오는 중"}
      </span>
      <p className="mt-3.5 flex items-baseline gap-1.5 text-text-strong">
        <span className="text-[14px] leading-5 font-medium">최근 본 제품</span>
        {summary ? (
          <span className="text-[28px] leading-[34px] font-bold">
            {summary.total}개
          </span>
        ) : (
          <Skeleton className="h-[34px] w-16" />
        )}
      </p>
      {summary ? (
        <p className="text-[12px] leading-[18px] text-text-body">
          목표에 맞는 제품(잘 맞음 · 맞는 편) {summary.matched}개
        </p>
      ) : (
        <Skeleton className="mt-0.5 h-3.5 w-48" />
      )}
      {summary ? (
        <div className="mt-3 flex h-2 w-[56.2cqw] gap-0.5 overflow-hidden rounded-[4px]">
          {/* 디자인 메모: 범례 없이 5구간 비율만. 개수가 0인 구간은 그리지 않는다.
              폭은 좁은 화면에서 그림을 덜 가리도록 카드 폭에 비례(370 기준 208) */}
          {BANDS.filter((b) => summary.bands[b] > 0).map((b) => (
            <span
              key={b}
              className={BAND_COLOR[b]}
              style={{ flexGrow: summary.bands[b] }}
            />
          ))}
          <span className="sr-only">
            {BANDS.filter((b) => summary.bands[b] > 0)
              .map((b) => `${SCORE_BAND_LABEL[b]} ${summary.bands[b]}개`)
              .join(", ")}
          </span>
        </div>
      ) : (
        <Skeleton className="mt-3 h-2 w-[56.2cqw]" />
      )}
      <div className="mt-4 flex items-center gap-2.5">
        {/* 디자인: 전체 보기 → 4-2 내 기록(점수별 보기) */}
        <Link
          href="/history?tab=grade"
          className="text-[13px] leading-[18px] font-medium text-text-body"
        >
          최근 본 제품 전체 보기 <span aria-hidden>›</span>
        </Link>
        {/* 디자인 메모: 분석 요청이 0개면 분홍 알약을 숨긴다 */}
        {summary && summary.requests > 0 && (
          <Link
            href="/my/requests"
            className="rounded-full bg-accent-pink-weak px-2.5 py-1 text-[12px] leading-4 font-bold text-accent-pink-text"
          >
            분석 요청 {summary.requests}개 <span aria-hidden>›</span>
          </Link>
        )}
      </div>
    </GoalCard>
  );
}
