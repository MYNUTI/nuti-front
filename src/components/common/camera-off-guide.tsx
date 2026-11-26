"use client";

import { useState } from "react";

import { Button } from "@/components/common/button";
import { Chip } from "@/components/common/chip";
import { StepList } from "@/components/common/step-list";
import { cn } from "@/lib/utils";

type Browser = "chrome" | "safari" | "samsung";

const BROWSER_LABEL: Record<Browser, string> = {
  chrome: "크롬",
  safari: "사파리",
  samsung: "삼성 인터넷",
};

// 크롬은 화면, 사파리·삼성 인터넷은 ⑩ 상태표 0-3x 줄의 문장 그대로. 메뉴 이름은 디자인 메모 「안 정함」(ONB_007)
const STEPS: Record<Browser, readonly React.ReactNode[]> = {
  chrome: [
    "주소창 왼쪽의 아이콘을 눌러요",
    "권한에서 카메라를 허용으로 바꿔요",
    <>
      이 화면으로 돌아와
      <br />
      아래 카메라 다시 켜기를 눌러요
    </>,
  ],
  safari: [
    "주소창의 '가가' 버튼을 눌러요",
    "'웹 사이트 설정'에서 카메라를 '허용'으로 바꿔요",
    "이 화면으로 돌아와 아래 '카메라 다시 켜기'를 눌러요",
  ],
  samsung: [
    "주소창의 자물쇠 아이콘을 눌러요",
    "'권한'에서 카메라를 허용해요",
    "이 화면으로 돌아와 아래 '카메라 다시 켜기'를 눌러요",
  ],
};

/*
 * 「카메라가 꺼져 있어요」 안내(0-3x · 3-7 카메라가 꺼져 있을 때). 제목 · 설명, 브라우저 칩 3개(고른 칩에 따라
 * 단계 문장만 바뀜), 단계 3줄, 「카메라 다시 켜기」. 다시 켰는데 아직 꺼져 있으면 버튼 위 빨간 문장
 * (【최종】 「아직 꺼져 있음」 — 0-3x 9311:30561 · 3-7 9311:30623). 아래 「카메라 없이」 칸은 쓰는 화면이 붙인다.
 */
export function CameraOffGuide({
  retryKind,
  stillOff,
  onRetry,
}: {
  /** 0-3x는 온보딩 라임, 3-7은 검정 주 버튼(【최종】) */
  retryKind: "lime" | "primary";
  stillOff: boolean;
  onRetry: () => void;
}) {
  const [browser, setBrowser] = useState<Browser>("chrome");

  return (
    <>
      <div className="flex flex-col gap-2 px-5 pt-2 pb-6">
        <h1 className="text-title1 text-text-strong">카메라가 꺼져 있어요</h1>
        <p className="text-body1 text-text-sub">
          브라우저 설정에서 카메라를 켜면
          <br />
          바로 찍을 수 있어요.
        </p>
      </div>
      <div
        role="group"
        aria-label="사용하는 브라우저"
        className="flex gap-2 px-5 pb-2"
      >
        {(Object.keys(BROWSER_LABEL) as Browser[]).map((b) => (
          <Chip key={b} selected={browser === b} onClick={() => setBrowser(b)}>
            {BROWSER_LABEL[b]}
          </Chip>
        ))}
      </div>
      <div className="pt-2 pb-6">
        <StepList steps={STEPS[browser]} />
      </div>
      <div className="flex flex-col px-5 pt-1 pb-5">
        {/* 영역이 먼저 있어야 읽으므로 늘 두고 글자만 바꾼다(간격은 문장이 있을 때만) */}
        <p
          role="alert"
          className={cn("text-body2 text-accent-pink-text", stillOff && "pb-1")}
        >
          {stillOff
            ? "아직 카메라가 꺼져 있어요. 2단계대로 허용으로 바꿔 주세요."
            : ""}
        </p>
        <Button
          type="button"
          kind={retryKind}
          className="w-full"
          onClick={onRetry}
        >
          카메라 다시 켜기
        </Button>
      </div>
    </>
  );
}
