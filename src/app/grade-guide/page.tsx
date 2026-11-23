import type { Metadata } from "next";
import Link from "next/link";

import { BackButton } from "@/components/common/back-button";
import { ListRow } from "@/components/common/list-row";
import { NumberedList } from "@/components/common/numbered-list";
import {
  SCORE_BAND_LABEL,
  ScoreRing,
  type ScoreBand,
} from "@/components/common/score-ring";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconSearch } from "@/components/icons";

export const metadata: Metadata = { title: "점수 기준" };

const STEPS = [
  {
    title: "영양성분 값을 모아요",
    description: "식약처 공공 영양성분 데이터와 포장 영양성분표를 써요.",
  },
  {
    title: "같은 양으로 맞춰요",
    description: (
      <>
        100g당 값으로 계산해요.
        <br />
        화면의 숫자도 100g당이에요.
      </>
    ),
  },
  {
    title: "목표에 따라 칼로리만 다르게 봐요",
    description: (
      <>
        다이어트는 100g당 칼로리가 낮을수록,
        <br />
        근육 증가는 높을수록 점수가 높아요.
        <br />
        다른 성분은 두 목표 모두 같게 봐요.
      </>
    ),
  },
  { title: "점수 구간에 따라 색을 다섯 가지로 나눠요" },
] as const;

// 디자인 「점수 구간」 표. 링 안 숫자는 예시(디자인 문구)
const BANDS: { band: ScoreBand; example: number }[] = [
  { band: 1, example: 92 },
  { band: 2, example: 76 },
  { band: 3, example: 62 },
  { band: 4, example: 45 },
  { band: 5, example: 21 },
];

function Band() {
  return <div aria-hidden className="h-2 bg-bg-band" />;
}

/*
 * 5-4 점수는 어떻게 매기나. 디자인 메모: 읽기만 하는 화면.
 * 오는 곳: 3-2 「점수 기준 보기 ›」, 순위 「점수 기준」, 내 정보 「점수 기준 보기」.
 * 뒤로 → 이전 화면, 검색 아이콘 → 2-3 검색.
 * 글은 디자인 문구 그대로 둔다. 등급 안내 API(GET /grades/guide)는 아직 데이터 레이어가 없다.
 */
export default function GradeGuidePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <TopBar
        title="점수 기준"
        left={<BackButton fallbackHref="/home" />}
        right={
          <TopBarButton asChild aria-label="검색">
            <Link href="/search">
              <IconSearch />
            </Link>
          </TopBarButton>
        }
      />
      <main className="pb-[calc(24px+var(--safe-bottom))]">
        <h2 className="px-5 pt-2 pb-4 text-title1 text-text-strong">
          모든 제품을 같은 방식으로 계산해
          <br />
          {/* 디자인 강조 색(변수 없이 지정된 값) */}
          <span className="text-[#246508]">0점부터 100점까지</span> 매겨요
        </h2>
        <div className="pb-4">
          <NumberedList items={STEPS} />
        </div>

        <Band />
        <section className="flex flex-col gap-3 px-5 py-6">
          <h3 className="text-body1-bold text-text-strong">점수 구간</h3>
          <ul className="flex flex-col gap-3">
            {BANDS.map((b) => (
              <li key={b.band} className="flex items-center gap-3">
                <ScoreRing score={b.example} band={b.band} size="S" />
                <span className="text-body1-medium text-text-strong">
                  {SCORE_BAND_LABEL[b.band]}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[13px] leading-5 text-text-sub">
            링 안 숫자는 예시예요.
          </p>
        </section>

        <Band />
        <section className="pt-2">
          <h3 className="px-5 pt-4 text-body1-bold text-text-strong">
            근거와 한계
          </h3>
          <ListRow
            title="기준 자료"
            description="2025 한국인 영양소 섭취기준"
          />
          <ListRow
            title="값이 없는 성분"
            description={
              <span className="break-keep">
                점수는 칼로리, 단백질, 당류, 포화지방, 트랜스지방, 콜레스테롤,
                나트륨 7가지가 모두 있는 제품만 매겨요. 식이섬유처럼 표시가 없는
                다른 성분은 0으로 계산해 점수가 낮게 나올 수 있어요.
              </span>
            }
          />
        </section>

        <div className="flex flex-col gap-1 px-5 pt-4 text-body2 text-text-sub">
          <p>
            쿠팡 링크로 구매한 제품에서 수수료를 받을 수 있습니다.
            <br />
            광고비와 수수료는 점수 계산에 반영되지 않습니다.
          </p>
          <p>영양 정보가 있는 제품만 순위에 올라요.</p>
        </div>
      </main>
    </div>
  );
}
