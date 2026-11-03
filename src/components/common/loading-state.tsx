"use client";

import { useEffect, useState } from "react";

/*
 * 피그마 공통 상태 「불러오는 중」의 시간 규칙.
 *   1초 미만 → 아무것도 띄우지 않음(빨리 끝나는 로딩에 회색이 번쩍이지 않게)
 *   1~10초 → 회색 자리(skeleton)
 *   10초 넘음 → 단계 문장(slowMessage)을 회색 자리 위에 덧붙인다
 * 불러오는 중인 동안만 렌더링하고, 다 불러오면 쓰는 쪽이 이 컴포넌트를 내린다.
 */
const SHOW_AFTER_MS = 1_000;
const SLOW_AFTER_MS = 10_000;

export function LoadingState({
  skeleton,
  slowMessage,
}: {
  skeleton: React.ReactNode;
  /** 10초가 넘으면 보일 문장(예: 「성분표 숫자를 읽고 있어요」) */
  slowMessage?: React.ReactNode;
}) {
  const [phase, setPhase] = useState<"hidden" | "skeleton" | "slow">("hidden");

  useEffect(() => {
    const show = setTimeout(() => setPhase("skeleton"), SHOW_AFTER_MS);
    const slow = setTimeout(() => setPhase("slow"), SLOW_AFTER_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(slow);
    };
  }, []);

  // 라이브 영역은 처음부터 두고 안쪽만 바꾼다. 내용과 함께 나중에 생기면 화면 읽기 프로그램이 읽지 않을 수 있다
  return (
    <div role="status">
      {phase !== "hidden" && <span className="sr-only">불러오는 중</span>}
      {phase === "slow" && slowMessage && (
        <p className="px-5 py-3 text-center text-body2 text-text-sub">
          {slowMessage}
        </p>
      )}
      {phase !== "hidden" && skeleton}
    </div>
  );
}
