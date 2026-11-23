import { BackButton } from "@/components/common/back-button";
import { LoadingState } from "@/components/common/loading-state";
import { SearchFieldLink } from "@/components/common/search-field";
import { Skeleton } from "@/components/common/skeleton";

/** 3-2 위 줄(뒤로 + 검색칸). 불러오는 중에도 그대로 둔다(디자인 메모) */
export function ProductTopBar() {
  return (
    <header className="flex h-14 items-center gap-1 pr-4 pl-1">
      <BackButton fallbackHref="/home" />
      {/* 디자인 메모: 검색칸 → 2-3 검색 */}
      <SearchFieldLink
        href="/search"
        placeholder="제품, 브랜드, 종류로 검색"
        className="min-w-0 flex-1"
      />
    </header>
  );
}

/*
 * 3-2 제품 결과(불러오는 중). 위 줄은 그대로, 아래는 3-2 배치 그대로의 회색 자리.
 * 1초 미만은 아무것도 띄우지 않고, 10초가 넘으면 문장을 덧붙인다(공통 LoadingState).
 */
export function ProductLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <ProductTopBar />
      <LoadingState
        // 디자인 메모는 「단계 문장」뿐이라 임시 문구(UI 플랜 「남은 질문」 1)
        slowMessage="제품 정보를 아직 불러오고 있어요"
        skeleton={
          <>
            <div className="flex flex-col gap-2.5 px-5 pt-2 pb-5">
              <Skeleton className="size-64 self-center rounded-md" />
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-[22px] w-[220px]" />
              <Skeleton className="h-3.5 w-30" />
            </div>
            <div className="flex flex-col gap-3 px-5 pt-2 pb-5">
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-13 rounded-md" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-[110px]" />
                  <Skeleton className="h-3.5 w-[70px]" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-35 rounded-full" />
                <Skeleton className="h-9 w-35 rounded-full" />
              </div>
            </div>
            <div aria-hidden className="h-2 bg-bg-band" />
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col gap-2 px-5 pt-4 pb-3">
                <Skeleton className="h-[18px] w-30" />
                <Skeleton className="h-3.5 w-[220px]" />
                <Skeleton className="h-1.5 w-full rounded-[3px]" />
              </div>
            ))}
          </>
        }
      />
    </div>
  );
}
