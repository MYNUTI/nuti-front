import Link from "next/link";

import { Button } from "@/components/common/button";
import { cn } from "@/lib/utils";

/*
 * 피그마 컴포넌트 v2/EmptyState — 빈 화면 3요소: 지금 상태 · 여기에 생기는 것 한 줄 · 채우는 버튼.
 * 피그마 공통 상태: 0건과 불러오기 실패도 이 구성을 쓰고 문장과 버튼만 다르다(⑩ 상태표가 문장의 정본).
 * 피그마 메모: 탭 화면 안이면 주 버튼 대신 secondary를 쓴다 — 버튼 종류는 넘기는 쪽이 정한다.
 */
export function EmptyState({
  title,
  description,
  image,
  actions,
  className,
}: {
  /** 줄바꿈(\n)을 넣으면 그대로 줄이 나뉜다 */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 96px 원 자리의 그림 */
  image?: React.ReactNode;
  /** M 크기 버튼 1~2개. 2개면 반씩 나눠 쓴다 */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-5 py-10 text-center",
        className,
      )}
    >
      {image && (
        <div className="size-24 overflow-hidden rounded-full bg-bg-tint *:size-full *:object-cover">
          {image}
        </div>
      )}
      <h2 className="text-title2 whitespace-pre-line text-text-strong">
        {title}
      </h2>
      {description && (
        <p className="text-body2 whitespace-pre-line text-text-sub">
          {description}
        </p>
      )}
      {actions && (
        <div className="flex w-full justify-center gap-2 [&:has(>:nth-child(2))>*]:flex-1">
          {actions}
        </div>
      )}
    </div>
  );
}

/*
 * 피그마 공통 상태 「불러오지 못했을 때」. 화면마다 제목만 다르다
 * (「제품 정보를 / 검색 결과를 / 기록을 / 최근 본 제품을 불러오지 못했어요」).
 * 「이름으로 찾기」는 3-2처럼 메모에 있는 화면에서만 켠다.
 */
export function ErrorState({
  title,
  onRetry,
  searchLink = false,
  retryKind = "primary",
  className,
}: {
  title: React.ReactNode;
  onRetry: () => void;
  searchLink?: boolean;
  /** 탭 화면 안이면 secondary(피그마 메모) */
  retryKind?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <EmptyState
      title={title}
      description="잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요."
      className={className}
      actions={
        <>
          <Button kind={retryKind} size="M" onClick={onRetry}>
            다시 시도
          </Button>
          {searchLink && (
            <Button kind="tertiary" size="M" asChild>
              <Link href="/search">이름으로 찾기</Link>
            </Button>
          )}
        </>
      }
    />
  );
}
