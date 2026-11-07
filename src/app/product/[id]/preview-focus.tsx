"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/*
 * 「다른 목표로 보기」를 켜고 끌 때 누른 링크가 다른 요소로 바뀌며 사라져 키보드·화면 읽기 포커스가 끊긴다.
 * 제목도 그대로라 화면이 바뀐 걸 알리지 못해, 링크를 눌러 바뀐 경우에만 새 상태의 첫 자리로 포커스를 옮긴다.
 * 주소로 바로 들어올 때는 옮기지 않는다(포커스를 빼앗지 않게).
 */
let moved = false;

export function PreviewLink(props: React.ComponentProps<typeof Link>) {
  return (
    <Link
      scroll={false}
      {...props}
      onClick={(event) => {
        moved = true;
        props.onClick?.(event);
      }}
    />
  );
}

export function FocusTarget({
  active = true,
  className,
  children,
}: {
  /** 이 상태에서 포커스를 받을 자리인지(미리 보기면 안내 줄, 내 목표면 점수) */
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !moved) return;
    moved = false;
    ref.current?.focus();
  }, [active]);

  return (
    <div ref={ref} tabIndex={-1} className={className}>
      {children}
    </div>
  );
}
