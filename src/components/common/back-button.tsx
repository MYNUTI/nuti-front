"use client";

import { useRouter } from "next/navigation";

import { TopBarButton } from "@/components/common/top-bar";
import { IconBack } from "@/components/icons";

/*
 * 상단 막대의 ‹ 뒤로. 브라우저 기록을 한 칸 되돌린다(링크로 이동하면 기록이 쌓여 뒤로 가기가 어색해진다).
 * 주소로 바로 들어와 돌아갈 기록이 없으면 fallbackHref로 간다.
 * history.length로만 판단해서, 다른 사이트에서 바로 들어온 경우엔 그 사이트로 돌아갈 수 있다.
 */
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const goBack = useGoBack(fallbackHref);

  return (
    <TopBarButton aria-label="뒤로" onClick={goBack}>
      <IconBack />
    </TopBarButton>
  );
}

/** 들어온 화면으로 돌아간다(BackButton과 같은 판단). ✕ · 「나중에 할게요」처럼 뒤로가 아닌 버튼에서 쓴다 */
export function useGoBack(fallbackHref: string) {
  const router = useRouter();
  return () => {
    if (window.history.length > 1) router.back();
    else router.replace(fallbackHref);
  };
}
