"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BackButton, useGoBack } from "@/components/common/back-button";
import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { ReasonRow } from "@/components/common/reason-row";
import { StepList } from "@/components/common/step-list";
import { TopBar } from "@/components/common/top-bar";
import type { Gtin } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

import { SENT_PHOTO_HREF, sendLabelPhoto } from "../../label-photo";
import { useLabelPhoto } from "../../use-label-photo";

const STEPS = [
  "포장을 펴서 표가 평평하게 보이게 해요",
  "조명 바로 아래를 피해 살짝 비스듬히 찍어요",
  "표의 네 모서리가 틀 안에 들어오게 해요",
];

/*
 * 3-7x 영양성분표를 못 읽었을 때(【최종】 ⑦ 9306:21729). 제목, 「이번 사진에서 걸린 점」(사진마다 다름, 없으면 숨김),
 * 「이렇게 찍으면 잘 읽혀요」 3줄, 아래 안내 문장, 「이 사진 그대로 보내기」 · 「다시 찍기」.
 * - 다시 찍기 · ‹ → 3-7. 이 사진 그대로 보내기 → 4-3 내 기록(분석 요청, 방금 보냈을 때)
 * - 보내기가 실패하면 머물고 버튼 위 「보내지 못했어요…」(3-8과 같음). 사진이 없으면 3-7로
 */
export function UnreadScreen({
  reasons,
  gtin,
  labelHref,
  failPreview,
}: {
  reasons: string[];
  gtin: Gtin | null;
  labelHref: string;
  failPreview: boolean;
}) {
  const router = useRouter();
  const retake = useGoBack(labelHref);
  const photo = useLabelPhoto(labelHref);
  const [failed, setFailed] = useState(false);

  if (!photo) return null;

  const send = () => {
    if (failPreview) {
      setFailed(true);
      return;
    }
    sendLabelPhoto(gtin);
    router.replace(SENT_PHOTO_HREF);
  };

  return (
    <main className="flex flex-1 flex-col bg-bg-page pt-safe">
      <TopBar left={<BackButton fallbackHref={labelHref} />} />
      <h1 className="px-5 pt-2 pb-4 text-title1 text-text-strong">
        영양성분표를 다 읽지 못했어요
      </h1>
      {reasons.length > 0 && (
        <section aria-label="이번 사진에서 걸린 점" className="pb-6">
          {reasons.map((reason) => (
            <ReasonRow key={reason} kind="bad">
              {reason}
            </ReasonRow>
          ))}
        </section>
      )}
      <div aria-hidden className="h-2 bg-bg-band" />
      <section aria-labelledby="unread-tips" className="pt-6">
        <h2
          id="unread-tips"
          className="px-5 pb-2 text-body1-bold text-text-strong"
        >
          이렇게 찍으면 잘 읽혀요
        </h2>
        <StepList steps={STEPS} />
      </section>
      <div className="min-h-6 flex-1" />
      <p className="px-5 pb-2 text-body2 text-text-sub">
        가려지거나 잘린 숫자는 운영팀도 읽기 어려워요.
        <br />
        다시 찍어 숫자가 읽히면 값을 확인한 뒤 점수를 볼 수 있어요.
      </p>
      <BottomCta>
        <div className="flex flex-1 flex-col">
          {/* 실패 문장 자리는 3-8과 같게 버튼 바로 위. 영역이 먼저 있어야 읽으므로 늘 둔다 */}
          <p
            role="alert"
            className={cn("text-body2 text-text-danger", failed && "pb-2")}
          >
            {failed
              ? "보내지 못했어요. 인터넷 연결을 확인하고 다시 보내 주세요. 적은 내용은 그대로 있어요."
              : ""}
          </p>
          <div className="flex gap-2">
            <Button kind="secondary" className="flex-1" onClick={send}>
              이 사진 그대로 보내기
            </Button>
            <Button kind="primary" className="flex-1" onClick={retake}>
              다시 찍기
            </Button>
          </div>
        </div>
      </BottomCta>
    </main>
  );
}
