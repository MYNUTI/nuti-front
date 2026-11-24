"use client";

import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/common/button";
import { BottomSheet } from "@/components/common/sheet";
import { useCameraPlace } from "@/components/scan/use-camera-place";

/*
 * 0-4 서비스 소개(카카오톡 안에서 열었을 때, 【최종】 9306:8730).
 * 앱 안 브라우저에서 처음 열면 0-4 위에 한 번만 띄운다. 앱 이름은 들어온 앱에 맞춘다.
 * 「다른 브라우저로 열기」 → 기본 브라우저에서 같은 주소(새 브라우저에서 처음 실행).
 * 「○○에서 계속하기」 · ✕ · 덮개 → 0-4, 다시 띄우지 않는다.
 * 앱 감지 · 바깥으로 여는 주소는 3-1 「카메라를 못 여는 곳」과 같은 판별을 쓴다. 실기기 확인이 남아 있다(【최종】 메모).
 */
const SEEN_KEY = "nuti_in_app_notice_v1";

// 저장값은 브라우저에서만 읽는다. 서버 렌더에서는 본 것으로 쳐서 띄우지 않는다
const subscribe = () => () => {};

function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // 저장이 막혀 있으면 다음에 열 때 다시 뜬다
  }
}

export function InAppBrowserSheet() {
  const place = useCameraPlace();
  const seen = useSyncExternalStore(subscribe, readSeen, () => true);
  const [closed, setClosed] = useState(false);

  if (!place || place.kind !== "in-app") return null;
  const { app, openExternal } = place;
  const close = () => {
    writeSeen();
    setClosed(true);
  };

  return (
    <BottomSheet
      open={!seen && !closed}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title="브라우저에서 여는 게 좋아요"
      description={
        <>
          {app} 안에서는 바코드 찍기나
          <br />
          구글 로그인이 안 될 수 있어요.
          <br />
          여기서 고른 목표와 기록은
          <br />
          저장되지 않아요.
        </>
      }
    >
      <div className="flex flex-col gap-2 pt-4">
        {/* 바깥 브라우저로 열 방법이 없는 곳(아이폰의 카카오톡 밖 앱 등)은 이 버튼을 뺀다(정한 것) */}
        {openExternal && (
          <Button
            type="button"
            kind="lime"
            onClick={() => {
              writeSeen();
              window.location.href = openExternal(window.location.href);
            }}
          >
            다른 브라우저로 열기
          </Button>
        )}
        <Button type="button" kind="secondary" onClick={close}>
          {app}에서 계속하기
        </Button>
      </div>
    </BottomSheet>
  );
}
