import type { Metadata } from "next";

import { ScanEntry } from "./scan-entry";

export const metadata: Metadata = {
  title: "스캔",
};

// 0-3 카메라 권한 안내 → 3-1 스캔. 같은 주소에서 상태로 바뀐다(UI 플랜 라우트 표)
export default async function ScanPage({ searchParams }: PageProps<"/scan">) {
  const { gtin, manual } = await searchParams;
  return (
    <ScanEntry
      // 숫자만 받는다. 사진에서 읽은 바코드를 홈의 시트가 넘긴다
      gtin={
        typeof gtin === "string" && /^\d{8,14}$/.test(gtin) ? gtin : undefined
      }
      manual={manual === "1"}
    />
  );
}
