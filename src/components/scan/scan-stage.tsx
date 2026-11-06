"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";
import { BottomSheet } from "@/components/common/sheet";
import { Toast } from "@/components/common/toast";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconClose, IconHash, IconImage, IconSearch } from "@/components/icons";
import { BarcodeScan } from "@/components/scan/barcode-scan";
import {
  useImageBarcode,
  type ImageMiss,
} from "@/components/scan/scan-image-input";
import { ScanManualInput } from "@/components/scan/scan-manual-input";
import {
  ScanMessageSheet,
  ScanResultSheet,
} from "@/components/scan/scan-result-sheet";
import { lookupProduct } from "@/lib/scan/lookup";
import type { Gtin, ScanSource } from "@/lib/scan/types";

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
  onPermissionDenied,
}: {
  /** 0-3x에서 사진으로 읽은 바코드. 들어오자마자 조회한다 */
  initialGtin?: Gtin | null;
  /** 0-3x 「바코드 번호 입력」으로 들어오면 입력 칸을 연 채로 시작한다 */
  initialManualOpen?: boolean;
  /** 카메라 권한이 거부되면 부른다(0-3x로 보내기) */
  onPermissionDenied?: () => void;
} = {}) {
  const [gtin, setGtin] = useState<Gtin | null>(initialGtin);
  const [imageMiss, setImageMiss] = useState<ImageMiss | null>(null);
  const [manualOpen, setManualOpen] = useState(initialManualOpen);
  const [missKey, setMissKey] = useState(0);

  const lookup = useQuery({
    queryKey: ["product", gtin],
    queryFn: gtin ? ({ signal }) => lookupProduct(gtin, signal) : skipToken,
  });

  const handleGtin = (value: Gtin, source: ScanSource) => {
    setGtin(value);
    setImageMiss(null);
    // 카메라는 직접 입력 중에도 계속 돈다. 카메라가 다른 바코드를 잡았다고 쓰던 폼을
    // 닫으면 입력이 날아간다.
    if (source === "manual") setManualOpen(false);
  };

  const renderSheet = () => {
    if (gtin === null) return null;
    if (lookup.isPending)
      return <ScanMessageSheet title="상품을 찾고 있어요" />;
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
        onGtin={handleGtin}
        showingResult={gtin !== null}
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
              <p className="absolute inset-x-0 top-[calc(50%+100px)] px-6 text-center text-body1 text-white">
                바코드를 틀 안에 맞춰 주세요
              </p>
            )}
            {renderSheet()}
          </>
        )}
      >
        {(state) => (
          <nav
            aria-label="다른 방법으로 찾기"
            // 디자인 186은 홈 인디케이터(34)를 뺀 높이라 기기 safe area를 더한다
            className="flex h-[calc(186px+var(--safe-bottom))] shrink-0 items-start justify-between px-10 pt-[46px] pb-safe"
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

      {/* 3-1(숫자로 입력) 시트를 만들기 전까지 예전 입력 폼을 시트에 담아 둔다 */}
      <BottomSheet
        open={manualOpen}
        onOpenChange={setManualOpen}
        title="바코드 번호 입력"
      >
        <div className="px-5 pb-5">
          <ScanManualInput onSubmit={(value) => handleGtin(value, "manual")} />
        </div>
      </BottomSheet>

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
