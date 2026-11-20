"use client";

import Link from "next/link";

import { Button } from "@/components/common/button";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { formatUpdatedDate, RANKING_GOAL_LABEL } from "@/lib/ranking/format";
import {
  useRankingCategories,
  useRankingOverviews,
} from "@/lib/ranking/queries";
import type { RankingGoal } from "@/lib/ranking/types";

import { FilterChips, RankingTabBar, RankingTitleBar } from "./ranking-frame";
import { GroupSkeleton, TopRow } from "./ranking-items";
import {
  rankingSource,
  reviewHref,
  useNotBuiltNotice,
  type ReviewQuery,
} from "./review";

// 묶음마다 그 대분류의 중분류 앞 3개에서 1위를 하나씩 보인다
const ROWS_PER_GROUP = 3;

/*
 * 2-2 점수 순위(종류를 고르지 않았을 때) — 하단 탭 「랭킹」을 처음 누르면 여는 화면.
 * 제목 줄(「랭킹」 + 고르지 않은 「종류」 버튼 + 검색), 필터 칩 「판매처」, 머리 줄, 대분류 묶음 목록.
 * 데이터: `GET /rankings/categories`로 대분류와 열린 칩을 받고, 열린 칩이 있는 대분류마다
 * `GET /rankings/overview`를 한 번씩 부른다.
 */
export function RankingHome({
  query,
  goal,
}: {
  query: ReviewQuery;
  goal?: RankingGoal;
}) {
  const source = rankingSource(query.sample);
  const notBuilt = useNotBuiltNotice();

  const categories = useRankingCategories(source);
  // 열린 칩이 없는 대분류는 묶음이 빈 채로 오므로 부르지 않는다
  const majors = (categories.data?.majors ?? []).filter(
    (major) => major.chips.length > 0,
  );
  const overviews = useRankingOverviews(
    majors.map((major) => major.code),
    { goal },
    source,
  );

  const groups = majors.map((major, index) => {
    const overview = overviews[index];
    return {
      major,
      pending: overview.isPending,
      failed: overview.isError,
      rows: (overview.data?.groups ?? [])
        .slice(0, ROWS_PER_GROUP)
        .flatMap((group) =>
          group.items[0]
            ? [{ chip: group.category, product: group.items[0] }]
            : [],
        ),
    };
  });
  const loading = categories.isPending || groups.some((g) => g.pending);
  const failedGroups = groups.filter((g) => g.failed).length;
  // 중분류에 점수 있는 제품이 없으면 그 줄을 빼고, 줄이 하나도 없는 묶음은 뺀다
  const shown = groups.filter((g) => g.rows.length > 0);

  const appliedGoal =
    overviews.find((overview) => overview.data)?.data?.goal ??
    goal ??
    "WEIGHT_LOSS";
  const updated = formatUpdatedDate(categories.data?.updatedAt ?? null);

  const retry = () => {
    if (categories.isError) void categories.refetch();
    overviews.forEach((overview) => {
      if (overview.isError) void overview.refetch();
    });
  };

  return (
    <>
      <main className="flex flex-1 flex-col bg-bg-page pb-[calc(57px+var(--safe-bottom))]">
        <header className="sticky top-0 z-10 bg-bg-page pt-safe">
          <RankingTitleBar
            major={null}
            onMajorClick={() => notBuilt.show("2-5f 식품 분류")}
          />
        </header>
        <FilterChips
          filters={["판매처"]}
          onFilterClick={() => notBuilt.show("2-5b 필터(판매처)")}
        />
        <div className="flex items-center gap-2 px-4 pt-1.5 pb-2.5 text-[12px] leading-4">
          <p className="min-w-0 flex-1 text-text-sub">
            {RANKING_GOAL_LABEL[appliedGoal]} 목표로 종류마다 1위
            {updated && (
              <>
                <br />
                {updated} 업데이트
              </>
            )}
          </p>
          <Link
            href="/grade-guide"
            className="shrink-0 font-medium whitespace-nowrap text-brand-link"
          >
            점수 기준 보기 ›
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 bg-bg-band px-4 pt-1 pb-4">
          {categories.isError ||
          (!loading && failedGroups > 0 && shown.length === 0) ? (
            <ErrorState
              // 랭킹의 오류 제목 문장은 상태표에 없다(결정 대기). 다른 화면의 꼴을 따른 임시 문장
              title="순위를 불러오지 못했어요"
              onRetry={retry}
              retryKind="secondary"
              className="rounded-md bg-white"
            />
          ) : loading && shown.length === 0 ? (
            <LoadingState
              skeleton={
                <div className="flex flex-col gap-2.5">
                  <GroupSkeleton />
                  <GroupSkeleton />
                </div>
              }
            />
          ) : shown.length === 0 ? (
            <EmptyState
              // 열린 종류가 하나도 없을 때의 화면은 그림에 없다. 임시 문장
              title="아직 순위가 열린 종류가 없어요"
              description="종류마다 점수 있는 제품이 충분히 모이면 순위가 열려요."
              className="rounded-md bg-white"
            />
          ) : (
            <>
              {shown.map(({ major, rows }) => (
                <section
                  key={major.code}
                  className="flex flex-col gap-1.5 rounded-md bg-white px-3.5 pt-3 pb-2"
                >
                  <div className="flex items-center">
                    <h2 className="min-w-0 flex-1 truncate text-[16px] leading-[19px] font-bold text-text-strong">
                      {major.name}
                    </h2>
                    <button
                      type="button"
                      className="shrink-0 text-[13px] leading-4 font-medium text-brand-link"
                      onClick={() =>
                        notBuilt.show("2-2 점수 순위(대분류 전체)")
                      }
                    >
                      전체 보기 ›
                    </button>
                  </div>
                  {rows.map(({ chip, product }) => (
                    <TopRow
                      key={chip.code}
                      chipName={chip.name}
                      product={product}
                    />
                  ))}
                </section>
              ))}
              {failedGroups > 0 && (
                // 일부 대분류만 실패했을 때의 모양은 그림에 없다. 받은 묶음은 보이고 다시 시도만 둔다.
                // 아래 여백은 버튼이 가운데 솟은 스캔 버튼에 가리지 않게 하는 값
                <div className="flex flex-col items-center gap-2 pt-2 pb-6 text-body2 text-text-sub">
                  불러오지 못한 종류가 있어요
                  <Button kind="secondary" size="M" onClick={retry}>
                    다시 시도
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <RankingTabBar rankingHref={reviewHref("/v3/rankings", query)} />
      {notBuilt.element}
    </>
  );
}
