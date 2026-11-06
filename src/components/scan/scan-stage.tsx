"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";
import { Skeleton } from "@/components/common/skeleton";
import { Toast } from "@/components/common/toast";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconClose, IconHash, IconImage, IconSearch } from "@/components/icons";
import { BarcodeScan } from "@/components/scan/barcode-scan";
import {
  useImageBarcode,
  type ImageMiss,
} from "@/components/scan/scan-image-input";
import { ScanManualSheet } from "@/components/scan/scan-manual-sheet";
import { ScanMissSheet } from "@/components/scan/scan-miss-sheet";
import {
  ScanMessageSheet,
  ScanResultSheet,
} from "@/components/scan/scan-result-sheet";
import { lookupProduct } from "@/lib/scan/lookup";
import type { Gtin, ScanSource } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

/*
 * 못 읽을 때의 시간 규칙(디자인 메모). 스캐너(lib/scan)의 15초 안내 대신 화면이 직접 센다.
 *   10초 못 읽음(메모 8~10초) = 실패 1번 → 틀 아래 문장만 바뀜, 인식은 계속
 *   20초 = 실패 2번 → 「바코드를 못 읽었을 때」 시트(메모 「2번 실패하거나 20초」가 같은 시점이 된다)
 */
const SLOW_AFTER_MS = 10_000;
const MISS_AFTER_MS = 20_000;

export const MISS_MESSAGE: Record<ImageMiss, string> = {
  "not-found":
    "사진에서 바코드를 찾지 못했어요. 다른 사진을 고르거나 직접 입력해 주세요",
  unreadable: "이미지를 읽지 못했어요. 다른 사진을 골라주세요",
};

/**
 * 3-1 스캔. 화면 전체가 카메라이고 아래에 버튼 3개(사진 올리기·바코드 번호 입력·이름으로 찾기).
 *
 * 카메라·앨범·직접 입력이 모두 같은 `handleGtin`으로 모인다. 상세는 내부 상품 ID로
 * 라우팅하므로 GTIN은 반드시 조회를 거쳐 결과 시트가 된다.
 */
export function ScanStage({
  initialGtin = null,
  initialManualOpen = false,
  cameraOff = false,
  onPermissionDenied,
}: {
  /** 0-3x에서 사진으로 읽은 바코드. 들어오자마자 조회한다 */
  initialGtin?: Gtin | null;
  /** 0-3x 「바코드 번호 입력」으로 들어오면 입력 칸을 연 채로 시작한다 */
  initialManualOpen?: boolean;
  /** 카메라를 열지 않는다(PC·앱 안 브라우저에서 사진·번호로 찾을 때) */
  cameraOff?: boolean;
  /** 카메라 권한이 거부되면 부른다(0-3x로 보내기) */
  onPermissionDenied?: () => void;
} = {}) {
  const [gtin, setGtin] = useState<Gtin | null>(initialGtin);
  // 「바코드를 읽었어요」는 카메라·사진으로 읽었을 때만 맞다. 0-3x·홈 시트에서 넘어온 바코드는 사진으로 읽은 것이다
  const [source, setSource] = useState<ScanSource>("photo");
  const [imageMiss, setImageMiss] = useState<ImageMiss | null>(null);
  const [manualOpen, setManualOpen] = useState(initialManualOpen);
  const [missKey, setMissKey] = useState(0);
  const [slow, setSlow] = useState(false);
  const [missOpen, setMissOpen] = useState(false);
  // 시트를 닫고 다시 비출 때마다 올려 시간을 처음부터 다시 센다
  const [readRound, setReadRound] = useState(0);

  const restartReading = () => {
    setSlow(false);
    setReadRound((n) => n + 1);
  };

  const lookup = useQuery({
    queryKey: ["product", gtin],
    queryFn: gtin ? ({ signal }) => lookupProduct(gtin, signal) : skipToken,
  });

  const handleGtin = (value: Gtin, source: ScanSource) => {
    setGtin(value);
    setSource(source);
    setImageMiss(null);
    setSlow(false);
    // 못 읽음 시트 뒤에서도 카메라는 돈다. 읽었으면 실패 안내는 거짓이 된다
    setMissOpen(false);
    // 카메라는 직접 입력 중에도 계속 돈다. 카메라가 다른 바코드를 잡았다고 쓰던 폼을
    // 닫으면 입력이 날아간다.
    if (source === "manual") setManualOpen(false);
  };

  // 3-1(읽힌 뒤 찾는 중). 디자인 메모: 결과가 오면 바로 3-2. 짧은 진동은 스캐너가 읽은 순간 낸다(use-scanner)
  const finding = gtin !== null && lookup.isPending;

  const renderSheet = () => {
    // 찾는 중 시트는 화면 아래에 따로 그린다(ScanFindingSheet)
    if (gtin === null || lookup.isPending) return null;
    if (lookup.isError) {
      return (
        <ScanMessageSheet
          title="상품 정보를 불러오지 못했어요"
          action={
            <CtaButton tone="secondary" onClick={() => lookup.refetch()}>
              다시 시도
            </CtaButton>
          }
        />
      );
    }
    if (lookup.data.status === "not-found") {
      // TODO: IA 3-6 미등록 화면이 생기면 그쪽으로 보낸다.
      return (
        <ScanMessageSheet
          title="등록되지 않은 상품이에요"
          description={`바코드 ${lookup.data.gtin} · 다른 상품을 찍어 보세요`}
        />
      );
    }
    return <ScanResultSheet result={lookup.data.result} />;
  };

  const photo = useImageBarcode({
    onGtin: (value) => handleGtin(value, "photo"),
    onMiss: (reason) => {
      setImageMiss(reason);
      setMissKey((k) => k + 1);
    },
  });

  return (
    <div className="flex h-dvh flex-col bg-bg-dark pt-safe">
      <BarcodeScan
        className="flex-1"
        cameraOff={cameraOff}
        onGtin={handleGtin}
        overlay={(state) => (
          <>
            {onPermissionDenied &&
              state.stage === "photo" &&
              state.reason === "permission-denied" && (
                <OnMount run={onPermissionDenied} />
              )}
            {/* 디자인 메모: ✕ → 2-1 홈 */}
            <TopBar
              tone="dark"
              className="absolute inset-x-0 top-0"
              right={
                <TopBarButton asChild aria-label="닫기">
                  <Link href="/home">
                    <IconClose />
                  </Link>
                </TopBarButton>
              }
            />
            {state.stage === "camera" && (
              // 조준 틀(세로 160) 아래 20
              <p
                aria-live="polite"
                className="absolute inset-x-0 top-[calc(50%+100px)] px-6 text-center text-body1 text-white"
              >
                {/* 다른 앱이 카메라를 쓰는 중이면 원인이 비추는 방법이 아니라서 바꾸지 않는다 */}
                {finding && source !== "manual"
                  ? "바코드를 읽었어요"
                  : slow && state.retryable === null
                    ? "빛 반사가 심한 것 같아요. 조금 기울여서 다시 비춰 볼까요?"
                    : "바코드를 틀 안에 맞춰 주세요"}
              </p>
            )}
            {state.stage === "camera" &&
              state.retryable === null &&
              gtin === null &&
              !manualOpen &&
              !missOpen && (
                <ReadTimer
                  key={readRound}
                  onSlow={() => setSlow(true)}
                  onMiss={() => setMissOpen(true)}
                />
              )}
            {renderSheet()}
          </>
        )}
      >
        {(state) => (
          <nav
            aria-label="다른 방법으로 찾기"
            // 디자인 186은 홈 인디케이터(34)를 뺀 높이라 기기 safe area를 더한다
            // 찾는 동안에는 디자인처럼 버튼 줄을 비워 두고 그 위에 찾는 중 시트를 올린다(자리는 남긴다)
            className={cn(
              "flex h-[calc(186px+var(--safe-bottom))] shrink-0 items-start justify-between px-10 pt-[46px] pb-safe",
              finding && "invisible",
            )}
          >
            {photo.input}
            <ScanAction
              icon={<IconImage />}
              // WASM이 죽었으면 사진도 읽을 수 없다.
              disabled={state.stage === "manual" || photo.reading}
              onClick={photo.open}
            >
              {photo.reading ? "읽는 중…" : "사진 올리기"}
            </ScanAction>
            <ScanAction icon={<IconHash />} onClick={() => setManualOpen(true)}>
              바코드 번호 입력
            </ScanAction>
            {/* 디자인 메모: 이름으로 찾기 → 2-3 검색 */}
            <ScanAction icon={<IconSearch />} href="/search">
              이름으로 찾기
            </ScanAction>
          </nav>
        )}
      </BarcodeScan>

      {finding && <ScanFindingSheet />}

      <ScanMissSheet
        open={missOpen}
        onOpenChange={(open) => {
          setMissOpen(open);
          if (!open) restartReading();
        }}
        onManual={() => {
          setMissOpen(false);
          setManualOpen(true);
        }}
      />

      {/* 3-1(숫자로 입력). 디자인 메모: ✕ → 3-1 스캔 */}
      <ScanManualSheet
        open={manualOpen}
        onOpenChange={(open) => {
          setManualOpen(open);
          if (!open) restartReading();
        }}
        onSubmit={(value) => handleGtin(value, "manual")}
      />

      {/* 「사진에서 바코드를 못 읽었을 때」 상태를 만들기 전까지 알림 띠로 알린다 */}
      {imageMiss && (
        <Toast
          key={missKey}
          // 하단 탭 대신 아래 버튼 줄(186 + safe area)이 있어 그 위 8에 띄운다
          className="bottom-[calc(194px+var(--safe-bottom))]"
          message={MISS_MESSAGE[imageMiss]}
        />
      )}
    </div>
  );
}

/** 아래 둥근 버튼. href가 있으면 링크, 없으면 버튼 */
function ScanAction({
  icon,
  href,
  onClick,
  disabled,
  children,
}: {
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <span className="flex size-14 items-center justify-center rounded-full bg-text-body text-white [&_svg]:size-6">
        {icon}
      </span>
      <span className="text-caption whitespace-nowrap text-white">
        {children}
      </span>
    </>
  );
  const className = "flex w-22 flex-col items-center gap-2 disabled:opacity-40";

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

/** 렌더 중에 부모 상태를 바꾸지 않도록, 그려진 뒤에 한 번 부른다 */
function OnMount({ run }: { run: () => void }) {
  useEffect(() => {
    run();
  }, [run]);
  return null;
}

/** 카메라로 읽는 동안만 그려 시간을 센다. 그려지지 않으면(결과·시트가 떠 있으면) 멈춘다 */
function ReadTimer({
  onSlow,
  onMiss,
}: {
  onSlow: () => void;
  onMiss: () => void;
}) {
  // 콜백이 그릴 때마다 새로 만들어져도 시간을 다시 세지 않게 한다
  const slowEvent = useEffectEvent(onSlow);
  const missEvent = useEffectEvent(onMiss);

  useEffect(() => {
    const slow = setTimeout(() => slowEvent(), SLOW_AFTER_MS);
    const miss = setTimeout(() => missEvent(), MISS_AFTER_MS);
    return () => {
      clearTimeout(slow);
      clearTimeout(miss);
    };
  }, []);
  return null;
}

/**
 * 3-1 스캔(읽힌 뒤 찾는 중). 아래 버튼 줄을 덮는 흰 시트에 제목과 회색 틀 두 줄.
 * 사용자가 닫는 시트가 아니라 결과가 오면 바뀌는 자리라 모달로 띄우지 않는다.
 */
function ScanFindingSheet() {
  return (
    <div
      role="status"
      className="fixed-app bottom-0 z-40 flex flex-col gap-3 rounded-t-sheet bg-bg-page px-5 pt-6 pb-[calc(26px+max(var(--safe-bottom),34px))]"
    >
      <p className="text-body1-bold text-text-strong">제품을 찾고 있어요</p>
      <Skeleton className="h-3.5 w-full rounded-[7px]" />
      <Skeleton className="h-3.5 w-60 rounded-[7px]" />
    </div>
  );
}
