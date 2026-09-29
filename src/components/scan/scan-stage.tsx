"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CtaButton } from "@/components/common/cta-button";
import { BarcodeScan } from "@/components/scan/barcode-scan";
import {
  ScanImageInput,
  type ImageMiss,
} from "@/components/scan/scan-image-input";
import { ScanManualInput } from "@/components/scan/scan-manual-input";
import {
  ScanMessageSheet,
  ScanResultSheet,
} from "@/components/scan/scan-result-sheet";
import { lookupProduct } from "@/lib/scan/lookup";
import type { ScanState } from "@/lib/scan/machine";
import type { Gtin, ScanSource } from "@/lib/scan/types";

const GUIDE: Record<ScanState["stage"], string> = {
  probing: "연속으로 찍으면 결과가 바로 바뀌어요",
  camera: "연속으로 찍으면 결과가 바로 바뀌어요",
  photo: "아래에서 사진을 고르거나 번호를 직접 입력해 주세요",
  manual: "아래에 바코드 번호를 입력해 주세요",
};

const MISS_MESSAGE: Record<ImageMiss, string> = {
  "not-found":
    "사진에서 바코드를 찾지 못했어요. 다른 사진을 고르거나 직접 입력해 주세요",
  unreadable: "이미지를 읽지 못했어요. 다른 사진을 골라주세요",
};

/**
 * 메인 탭 스캔 호스트.
 *
 * 카메라·앨범·직접 입력이 모두 같은 `handleGtin`으로 모인다. 상세는 내부 상품 ID로
 * 라우팅하므로 GTIN은 반드시 조회를 거쳐 결과 시트가 된다.
 */
export function ScanStage() {
  const [gtin, setGtin] = useState<Gtin | null>(null);
  const [imageMiss, setImageMiss] = useState<ImageMiss | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

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

  return (
    <>
      <BarcodeScan
        className="aspect-7/8"
        onGtin={handleGtin}
        overlay={renderSheet()}
      >
        {(state) => (
          <>
            <p className="mt-4 text-[15px] text-muted-foreground">
              {GUIDE[state.stage]}
            </p>

            <div className="mt-4 flex gap-2.5">
              <div className="flex-1">
                <ScanImageInput
                  className="h-12"
                  // WASM이 죽었으면 사진도 읽을 수 없다.
                  disabled={state.stage === "manual"}
                  onGtin={(value) => handleGtin(value, "photo")}
                  onMiss={setImageMiss}
                >
                  앨범에서 선택
                </ScanImageInput>
              </div>
              <div className="flex-1">
                <CtaButton
                  tone="secondary"
                  className="h-12"
                  aria-expanded={manualOpen || state.stage === "manual"}
                  // manual 단계에서는 폼이 늘 열려 있어 접을 수 없다.
                  disabled={state.stage === "manual"}
                  onClick={() => setManualOpen((open) => !open)}
                >
                  직접 입력
                </CtaButton>
              </div>
            </div>

            {imageMiss && (
              <p role="status" className="mt-3 text-[13px] text-destructive">
                {MISS_MESSAGE[imageMiss]}
              </p>
            )}

            {(manualOpen || state.stage === "manual") && (
              <div className="mt-4">
                <ScanManualInput
                  onSubmit={(value) => handleGtin(value, "manual")}
                />
              </div>
            )}
          </>
        )}
      </BarcodeScan>
    </>
  );
}
