"use client";

import { useEffect, useState } from "react";

import { TabBar } from "@/components/common/tab-bar";
import { ScanStage } from "@/components/scan/scan-stage";
import type { Gtin } from "@/lib/scan/types";

import { CameraOff } from "./camera-off";
import { CameraPermission } from "./camera-permission";

/*
 * 스캔에 들어오면 카메라 권한부터 본다. 디자인 메모: 한 번 허용하면 다음부터는 0-3 없이 바로 3-1.
 *   허용됨 → 3-1 스캔 · 거부됨 → 0-3x · 아직 안 물어봄·알 수 없음 → 0-3 권한 안내
 * 권한 창은 스캐너가 카메라를 열 때(getUserMedia) 뜬다. 그래서 「카메라 허용하기」는 스캐너를 띄우기만 하고,
 * 거기서 거부하면 스캐너가 알려 0-3x로 간다.
 */
type Step =
  | { name: "checking" | "ask" | "denied" | "scan" }
  /** 0-3x의 카메라 없이 찾기. 카메라가 꺼진 채로 스캔 화면의 사진·번호 입력을 쓴다 */
  | { name: "no-camera"; gtin?: Gtin; manual?: boolean };

function queryCamera(): Promise<PermissionState | "unknown"> {
  // permissions.query가 없거나 "camera"를 모르는 브라우저는 알 수 없음으로 둔다
  const query =
    navigator.permissions?.query({ name: "camera" }) ??
    Promise.reject(new Error("permissions API 없음"));
  return query.then(
    (status) => status.state,
    () => "unknown" as const,
  );
}

export function ScanEntry() {
  const [step, setStep] = useState<Step>({ name: "checking" });

  useEffect(() => {
    let cancelled = false;
    void queryCamera().then((state) => {
      if (cancelled) return;
      setStep({
        name:
          state === "granted" ? "scan" : state === "denied" ? "denied" : "ask",
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const retry = () => {
    // 디자인 메모: 아직 꺼져 있으면 그대로. 거부로 확인될 때만 머물고, 나머지는 스캐너가 다시 확인한다
    void queryCamera().then((state) => {
      if (state !== "denied") setStep({ name: "scan" });
    });
  };

  switch (step.name) {
    // 확인은 순간이라 그 사이 안내 화면이 번쩍이지 않게 아무것도 그리지 않는다
    case "checking":
      return null;
    case "ask":
      return <CameraPermission onAllow={() => setStep({ name: "scan" })} />;
    case "denied":
      return (
        <CameraOff
          onRetry={retry}
          onPhotoGtin={(gtin) => setStep({ name: "no-camera", gtin })}
          onManual={() => setStep({ name: "no-camera", manual: true })}
        />
      );
    case "scan":
    case "no-camera":
      return (
        <main className="flex flex-1 flex-col pt-safe">
          <div className="flex flex-1 flex-col px-5 pt-14 pb-32">
            <ScanStage
              initialGtin={step.name === "no-camera" ? step.gtin : null}
              initialManualOpen={step.name === "no-camera" && step.manual}
              onPermissionDenied={
                step.name === "scan"
                  ? () => setStep({ name: "denied" })
                  : undefined
              }
            />
          </div>
          <TabBar />
        </main>
      );
  }
}
