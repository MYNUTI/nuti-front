"use client";

import { useState } from "react";

import { Toast } from "@/components/common/toast";
import { DEFAULT_RANKING_SORT } from "@/lib/ranking/format";
import { liveRanking, type RankingSource } from "@/lib/ranking/queries";
import type { RankingSort } from "@/lib/ranking/types";

import { sampleRanking } from "../../_sample/sample-http";

/*
 * 검토용 화면(/v3)에서만 쓰는 것들. 주소에 실어 다니는 값은 셋이다.
 *   ?sample=1 — 서버 대신 예시 자료로 본다(`_sample/`)
 *   ?goal=diet|muscle — 기존 미리보기 주소와 같은 목표 값. 없으면 서버 기본(감량)
 *   ?sort=… — 고른 정렬. 중분류 탭을 옮겨도 유지하고, 하단 탭으로 랭킹을 새로 열면 기본으로 돌아간다
 */
export type ReviewQuery = {
  sample: boolean;
  /** 주소에 적힌 그대로(`diet`·`muscle`). 링크에 다시 실을 때 쓴다 */
  goalParam?: string;
};

export function rankingSource(sample: boolean): RankingSource {
  return sample ? sampleRanking : liveRanking;
}

/** 검토용 값을 붙인 주소. 기본 정렬은 주소에 적지 않는다 */
export function reviewHref(
  path: string,
  query: ReviewQuery,
  sort?: RankingSort,
): string {
  const params = new URLSearchParams();
  if (query.sample) params.set("sample", "1");
  if (query.goalParam) params.set("goal", query.goalParam);
  if (sort && sort !== DEFAULT_RANKING_SORT) params.set("sort", sort);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

/*
 * 이번 묶음에 아직 붙이지 않은 화면(시트·다른 상태)으로 가는 버튼을 눌렀을 때의 알림.
 * 버튼 모양은 그림 그대로 두고, 누르면 어느 화면이 아직 없는지만 알린다.
 */
export function useNotBuiltNotice() {
  const [notice, setNotice] = useState<{ id: number; screen: string } | null>(
    null,
  );

  return {
    show: (screen: string) =>
      setNotice((prev) => ({ id: (prev?.id ?? 0) + 1, screen })),
    element: notice && (
      <Toast
        // 같은 버튼을 다시 눌러도 알림이 다시 뜨게 한다
        key={notice.id}
        message={`${notice.screen}: 이번 검토 묶음에는 아직 없는 화면이에요`}
      />
    ),
  };
}
