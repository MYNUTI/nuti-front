import type { Metadata } from "next";

import { ScanEntry } from "./scan-entry";

export const metadata: Metadata = {
  title: "스캔",
};

// 0-3 카메라 권한 안내 → 3-1 스캔. 같은 주소에서 상태로 바뀐다(UI 플랜 라우트 표)
export default function ScanPage() {
  return <ScanEntry />;
}
