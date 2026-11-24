/*
 * 2-2 점수 순위의 글자 · 주소 값 다루기. `review/v3-rankings`의 `src/lib/ranking/format.ts`를 옮겼다
 * (API 연결 때 그 파일로 바꾼다).
 */
import type { RankingCoverage, RankingGoal, RankingSort } from "./_fixtures";

/** 화면에서 부르는 목표 이름. 서버 문구는 「체중 감량」이라 화면 이름을 따로 둔다 */
export const RANKING_GOAL_LABEL: Record<RankingGoal, string> = {
  WEIGHT_LOSS: "다이어트",
  MUSCLE_GAIN: "근육 증가",
};

/** 정렬 시트의 줄(【최종】 2-2 정렬 고르기). 「인기순」은 인기 자료가 생길 때까지 숨긴다 */
export const RANKING_SORT_OPTIONS: { value: RankingSort; label: string }[] = [
  { value: "SCORE", label: "점수 높은 순" },
  { value: "CALORIES_LOW", label: "칼로리 낮은 순" },
  { value: "PROTEIN_HIGH", label: "단백질 많은 순" },
  { value: "SUGAR_LOW", label: "당류 적은 순" },
];

export const DEFAULT_RANKING_SORT: RankingSort = "SCORE";

/** 【최종】 메모: 목록 끝에 닿을 때마다 다음 12개 */
export const RANKING_PAGE_SIZE = 12;

/** 주소의 `?n=`(불러온 개수)을 읽는다. 12의 배수로 올리고, 틀렸거나 12 이하면 12 */
export function parseRankingShown(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > RANKING_PAGE_SIZE
    ? Math.ceil(n / RANKING_PAGE_SIZE) * RANKING_PAGE_SIZE
    : RANKING_PAGE_SIZE;
}

/** 주소의 `?sort=` 값을 정렬로 읽는다. 시트에 없는 값은 기본 정렬 */
export function parseRankingSort(value: unknown): RankingSort {
  return (
    RANKING_SORT_OPTIONS.find((option) => option.value === value)?.value ??
    DEFAULT_RANKING_SORT
  );
}

/** 주소의 `?goal=` 값(기존 미리보기 주소 `diet` · `muscle`). 그 밖은 다이어트 */
export function parseRankingGoal(value: unknown): RankingGoal {
  return value === "muscle" ? "MUSCLE_GAIN" : "WEIGHT_LOSS";
}

/**
 * 「10월 18일」. 서버 날짜는 타임존 없는 ISO 문자열이라 글자에서 월 · 일만 읽는다
 * (`new Date()`로 읽으면 보는 기기의 시간대에 따라 하루 밀릴 수 있다). 읽지 못하면 null
 */
export function formatUpdatedDate(iso: string | null): string | null {
  const match = iso ? /^\d{4}-(\d{2})-(\d{2})/.exec(iso) : null;
  if (!match) return null;
  return `${Number(match[1])}월 ${Number(match[2])}일`;
}

/**
 * 「52개 중 48개 점수 있음, 10월 18일 업데이트」. 모두 점수가 있으면 「52개, 10월 18일 업데이트」(SRCH_007).
 * 날짜가 없으면 개수만
 */
export function formatCoverage(coverage: RankingCoverage): string {
  const total = coverage.total.toLocaleString("ko-KR");
  const counts =
    coverage.analyzed >= coverage.total
      ? `${total}개`
      : `${total}개 중 ${coverage.analyzed.toLocaleString("ko-KR")}개 점수 있음`;
  const date = formatUpdatedDate(coverage.updatedAt);
  return date ? `${counts}, ${date} 업데이트` : counts;
}
