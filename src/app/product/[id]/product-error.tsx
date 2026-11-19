"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { ErrorState } from "@/components/common/empty-state";

import { ProductTopBar } from "./product-loading";

const TITLE = "제품 정보를 불러오지 못했어요";

/*
 * 3-2 제품 결과(불러오지 못했을 때). 위 줄은 그대로, 가운데에 공통 「불러오지 못했을 때」.
 * 디자인 메모: 다시 시도 → 불러오는 중 · 이름으로 찾기 → 2-3 검색.
 * onRetry가 없으면(?state=error 확인용) 확인용 표시(state)만 뺀 주소로 다시 연다.
 */
export function ProductError({ onRetry }: { onRetry?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mainRef = useRef<HTMLElement>(null);

  // 화면이 통째로 바뀌며 생겨 미리 둔 라이브 영역으로는 알릴 수 없다. 나타날 때(다시 시도 뒤 또 실패해도) 본문으로 포커스를 옮겨 제목을 읽게 한다
  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  const retryPreview = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("state");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe">
      <ProductTopBar />
      <main
        ref={mainRef}
        tabIndex={-1}
        aria-label={TITLE}
        className="pt-40 outline-none"
      >
        <ErrorState
          title={TITLE}
          searchLink
          onRetry={onRetry ?? retryPreview}
        />
      </main>
    </div>
  );
}
