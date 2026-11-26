"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { getLabelPhoto } from "./label-photo";

const noop = () => () => {};

/**
 * 3-7에서 찍거나 고른 사진(3-7x · 3-8). 메모리에 없으면(새로 고침 등) 3-7로 바꿔 간다. 서버 렌더와 하이드레이션 첫
 * 렌더는 null이다
 */
export function useLabelPhoto(labelHref: string) {
  const router = useRouter();
  const photo = useSyncExternalStore(noop, getLabelPhoto, () => null);

  // 렌더 값이 아니라 지금 메모리를 본다(하이드레이션 첫 렌더는 서버 값 null이라 그걸로 판단하면 늘 돌려보낸다)
  useEffect(() => {
    if (!getLabelPhoto()) router.replace(labelHref);
  }, [labelHref, router]);

  return photo;
}
