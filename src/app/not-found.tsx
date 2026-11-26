import Link from "next/link";

import { Button } from "@/components/common/button";

// 그림이 없는 화면이라 문장은 그대로 두고 v3 글자 스타일 · 공통 버튼으로만 맞췄다(13단계 예전 토큰 정리)
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col bg-bg-page pt-safe pb-[max(var(--safe-bottom),12px)]">
      <div className="flex flex-1 flex-col justify-center gap-2 px-5">
        <h1 className="text-title1 text-text-strong">
          찾을 수 없는
          <br />
          페이지예요
        </h1>
        <p className="text-body1 text-text-sub">
          주소가 바뀌었거나 삭제된 제품일 수 있어요.
        </p>
      </div>
      <div className="px-5 pt-3">
        <Button className="w-full" asChild>
          <Link href="/home">홈으로</Link>
        </Button>
      </div>
    </main>
  );
}
