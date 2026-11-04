"use client";

import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/common/empty-state";

/*
 * 최근 본 제품을 못 불러왔을 때 목표 카드 자리에 대신 놓는다(상태표: 그 칸만 불러오지 못했을 때 구성).
 * 홈은 탭 화면이라 「다시 시도」는 secondary다.
 */
export function RecentError() {
  const router = useRouter();

  return (
    <ErrorState
      title="최근 본 제품을 불러오지 못했어요"
      retryKind="secondary"
      onRetry={() => router.refresh()}
      className="py-8"
    />
  );
}
