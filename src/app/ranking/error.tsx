"use client";

import { ErrorState } from "@/components/common/empty-state";
import { TabBar } from "@/components/common/tab-bar";

/*
 * 2-2 서버 렌더가 실패했을 때(분류 `GET /rankings/categories` 조회 실패 · 시간 초과). 칩 탭을 옮길 때마다 서버가 분류를
 * 다시 불러 실패에 닿을 수 있어, 하단 탭은 둔 채 화면 안의 오류(「순위를 불러오지 못했어요」, 【최종】 2-2 메모)로 받는다
 */
export default function Error({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <>
      <main className="flex flex-1 flex-col bg-bg-page pt-safe pb-[calc(57px+var(--safe-bottom))]">
        <ErrorState
          title="순위를 불러오지 못했어요"
          onRetry={retry}
          retryKind="secondary"
          className="flex-1"
        />
      </main>
      <TabBar />
    </>
  );
}
