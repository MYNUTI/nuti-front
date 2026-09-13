"use client";

import { useState } from "react";
import { CtaButton } from "@/components/common/cta-button";
import { BarcodeScan } from "@/components/scan/barcode-scan";
import type { Gtin, ScanSource } from "@/lib/scan/types";

/**
 * 메인 탭 스캔 호스트.
 *
 * 스캐너는 GTIN만 주므로 상품 조회와 결과 시트는 여기가 소유한다. 조회를 붙이기 전까지는
 * 확보한 GTIN을 그대로 보여준다 — 등급은 서버 값만 쓰기 때문에 임의로 만들지 않는다.
 */
export function ScanStage() {
  const [scanned, setScanned] = useState<{
    gtin: Gtin;
    source: ScanSource;
  } | null>(null);

  return (
    <>
      <BarcodeScan
        className="aspect-7/8"
        onGtin={(gtin, source) => setScanned({ gtin, source })}
        renderFallback={(state) =>
          state.stage === "manual" && (
            <p className="mt-4 text-[15px] text-muted-foreground">
              바코드를 읽지 못했어요. 아래에서 직접 입력해 주세요.
            </p>
          )
        }
      />

      <p className="mt-4 text-[15px] text-muted-foreground">
        {scanned
          ? `인식됨 · ${scanned.gtin}`
          : "연속으로 찍으면 결과가 바로 바뀌어요"}
      </p>

      <div className="mt-4 flex gap-2.5">
        <div className="flex-1">
          {/* TODO(3단계 14): scan-image-input.tsx 연결 */}
          <CtaButton tone="secondary" className="h-12">
            앨범에서 선택
          </CtaButton>
        </div>
        <div className="flex-1">
          {/* TODO(3단계 15): scan-manual-input.tsx 연결 */}
          <CtaButton tone="secondary" className="h-12">
            직접 입력
          </CtaButton>
        </div>
      </div>

      {/* TODO(3단계 16): lookup.ts를 거쳐 ScanResultSheet를 띄운다. */}
    </>
  );
}
