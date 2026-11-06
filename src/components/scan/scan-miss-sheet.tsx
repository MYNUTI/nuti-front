"use client";

import Link from "next/link";

import { Button } from "@/components/common/button";
import { BottomSheet } from "@/components/common/sheet";

/**
 * 3-1 스캔(바코드를 못 읽었을 때). 카메라 위 바텀시트. 뒤의 카메라는 계속 켜 둔다.
 * 디자인 메모: ✕·「다시 비추기」 → 3-1 스캔(닫고 다시 인식)
 */
export function ScanMissSheet({
  open,
  onOpenChange,
  onManual,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 바코드 번호 입력. 시트 위에 시트를 띄우지 않으니 이 시트를 닫고 숫자 입력 시트를 연다 */
  onManual: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="바코드를 읽지 못했어요"
      description={
        <>
          흔들리거나 빛이 반사되면 잘 안 읽혀요.
          <br />
          다른 방법으로 찾아볼까요?
        </>
      }
    >
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          kind="secondary"
          size="M"
          className="flex-1"
          onClick={onManual}
        >
          바코드 번호 입력
        </Button>
        {/* 디자인 메모: 이름으로 찾기 → 2-3 검색 */}
        <Button size="M" className="flex-1" asChild>
          <Link href="/search">이름으로 찾기</Link>
        </Button>
      </div>
      <div className="mt-4 flex justify-center gap-1">
        {/* 디자인 메모: 영양성분표 찍어 분석하기 → 3-7. 경로는 UI 플랜 라우트 표의 /contribute/* */}
        <Button kind="text" size="M" asChild>
          <Link href="/contribute/label">영양성분표 찍고 점수 보기</Link>
        </Button>
        <Button
          type="button"
          kind="text"
          size="M"
          onClick={() => onOpenChange(false)}
        >
          다시 비추기
        </Button>
      </div>
    </BottomSheet>
  );
}

/**
 * 3-1 스캔(사진에서 바코드를 못 읽었을 때). 0-3x·3-1·카메라를 못 여는 곳에서 같은 틀을 쓴다.
 * 디자인 메모: 입력 형식 오류(브라우저가 못 여는 사진)도 같은 틀이라 못 읽은 이유를 나누지 않는다.
 */
export function PhotoMissSheet({
  open,
  onOpenChange,
  onManual,
  onPickAgain,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 바코드 번호 입력. 없으면 버튼을 숨긴다(PC 안내 시트는 번호 입력을 두지 않는다) */
  onManual?: () => void;
  /** 다른 사진 고르기. 사진 고르기 창은 누른 순간에 열어야 해서 쓰는 쪽이 연다 */
  onPickAgain: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="사진에서 바코드를 못 읽었어요"
      description={
        <>
          바코드가 또렷하게 나온 사진을 골라 주세요.
          <br />
          {/* 번호 입력이 없는 곳(PC)에서는 없는 방법을 안내하지 않는다 */}
          {onManual ? "번호나 이름으로도" : "이름으로도"} 찾을 수 있어요.
        </>
      }
    >
      <div className="mt-2 flex gap-2">
        {onManual && (
          <Button
            type="button"
            kind="secondary"
            size="M"
            className="flex-1"
            onClick={onManual}
          >
            바코드 번호 입력
          </Button>
        )}
        <Button size="M" className="flex-1" asChild>
          <Link href="/search">이름으로 찾기</Link>
        </Button>
      </div>
      <div className="mt-4 flex justify-center">
        <Button type="button" kind="text" size="M" onClick={onPickAgain}>
          다른 사진 고르기
        </Button>
      </div>
    </BottomSheet>
  );
}
