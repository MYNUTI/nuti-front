"use client";

import { useEffect, useState } from "react";

import { TabBar } from "@/components/common/tab-bar";
import { ScanStage } from "@/components/scan/scan-stage";

import { CameraPermission } from "./camera-permission";

/*
 * 스캔에 들어오면 카메라 권한부터 본다. 디자인 메모: 한 번 허용하면 다음부터는 0-3 없이 바로 3-1.
 *   허용됨 → 3-1 스캔 · 아직 안 물어봄·알 수 없음 → 0-3 권한 안내
 * 권한 창은 스캐너가 카메라를 열 때(getUserMedia) 뜬다. 그래서 「카메라 허용하기」는 스캐너를 띄우기만 한다.
 * 거부했을 때 0-3x 화면은 다음 작업에서 붙인다(지금은 스캐너의 「권한이 허용되지 않았어요」 자리).
 */
type Step = "checking" | "ask" | "scan";

export function ScanEntry() {
  const [step, setStep] = useState<Step>("checking");

  useEffect(() => {
    let cancelled = false;
    // permissions.query가 없거나 "camera"를 모르는 브라우저는 물어보기 전과 같이 안내부터 보인다
    const query =
      navigator.permissions?.query({ name: "camera" }) ??
      Promise.reject(new Error("permissions API 없음"));
    query
      .then((status) => {
        if (!cancelled) setStep(status.state === "granted" ? "scan" : "ask");
      })
      .catch(() => {
        if (!cancelled) setStep("ask");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 확인은 순간이라 그 사이 안내 화면이 번쩍이지 않게 아무것도 그리지 않는다
  if (step === "checking") return null;
  if (step === "ask")
    return <CameraPermission onAllow={() => setStep("scan")} />;

  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-32">
        <ScanStage />
      </div>
      <TabBar />
    </main>
  );
}
