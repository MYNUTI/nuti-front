"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/common/button";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { SectionHeader } from "@/components/common/section-header";
import { nameWithoutBrand } from "@/components/common/product-card";
import { StatusTag } from "@/components/common/status-tag";
import { Thumb } from "@/components/common/thumb";
import { Toast } from "@/components/common/toast";

import type { RequestItem } from "./requests";
import {
  describeRequest,
  groupRequests,
  KIND_LABEL,
  requestHref,
  STATUS_TAG,
} from "./requests";

// 아래 버튼 줄(44) · 그 아래 여백(36) · 하단 탭(57) 위 8(메모). 버튼 줄은 하단 탭 위에 붙어 있다
const TOAST_ABOVE_BUTTONS = "bottom-[calc(145px+var(--safe-bottom))]";

/*
 * 4-3 내 기록 — 분석 요청(【최종】 ⑧ 9306:22632 · 아직 없을 때 22668 · 방금 보냈을 때 22705).
 * 묶음 셋(분석 못 한 요청 · 처리 중 · 완료, 이름 옆 개수, 없는 묶음은 숨김), 줄마다 「브랜드 · 요청 종류」 · 이름 ·
 * 설명 한 줄 · 상태 알약. 분석 못 함 줄 아래 「사진으로 숫자를 읽지 못했어요 · 다시 찍기 ›」(→ 3-7).
 * 하단 탭 위에 붙은 「제품 요청하기」(→ 3-6 제품 요청하기) · 「바코드 찍기」(두 그림 모두 같은 자리).
 * - 확인 중 분석 요청 → 3-9, 정보 수정 요청 · 완료 → 3-2, 분석 중 · 분석 못 함은 누르는 곳이 아니다
 * - 3-6 제품 요청하기 · 이 사진 그대로 보내기에서 오면(`?sent=`) 「보냈어요. 진행 상황은 여기서 볼 수 있어요.」를 한 번
 *   (목록이면 버튼 줄 위 8, 빈 상태 · 오류면 공통 자리)
 * - 0건이면 「아직 보낸 요청이 없어요」 + 버튼 + 「영양성분표가 필요한 제품」(0개면 숨김)
 */
export function RequestsTab({
  sent,
  ...props
}: React.ComponentProps<typeof RequestsBody> & { sent: boolean }) {
  const router = useRouter();
  // 한 번만 띄우고 주소에서 `sent`만 뺀다(새로 고치거나 뒤로 와도 다시 뜨지 않게, 미리 보기 `state`는 남김)
  const [showSent] = useState(sent);

  useEffect(() => {
    if (!sent) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("sent");
    router.replace(`/history?${params}`, { scroll: false });
  }, [sent, router]);

  const list = props.state === "ok" && props.requests.length > 0;
  return (
    <>
      <RequestsBody {...props} />
      {showSent && (
        <Toast
          message="보냈어요. 진행 상황은 여기서 볼 수 있어요."
          className={list ? TOAST_ABOVE_BUTTONS : undefined}
        />
      )}
    </>
  );
}

function RequestsBody({
  state,
  requests,
  needsLabel,
}: {
  state: "ok" | "error";
  requests: RequestItem[];
  needsLabel: {
    id: string;
    brand: string | null;
    name: string;
    image: string | null;
  }[];
}) {
  const router = useRouter();
  const [now] = useState(() => new Date());

  const buttons = (
    <>
      <Button size="M" asChild>
        <Link href="/contribute/request">제품 요청하기</Link>
      </Button>
      <Button kind="secondary" size="M" asChild>
        <Link href="/scan">바코드 찍기</Link>
      </Button>
    </>
  );

  if (state === "error")
    return (
      <ErrorState
        title="분석 요청을 불러오지 못했어요"
        retryKind="secondary"
        onRetry={() => router.refresh()}
      />
    );

  if (requests.length === 0)
    return (
      <>
        <EmptyState
          title="아직 보낸 요청이 없어요"
          description={
            "없는 제품을 알려 주면 분석해서\n모두가 볼 수 있게 해요."
          }
          className="pb-6"
          actions={buttons}
        />
        {needsLabel.length > 0 && (
          <section aria-labelledby="needs-label">
            <div aria-hidden className="h-2 bg-bg-band" />
            <SectionHeader
              title={<span id="needs-label">영양성분표가 필요한 제품</span>}
              description="많이 찾았지만 아직 점수가 없어요"
            />
            <ul>
              {needsLabel.map((p, i) => (
                <li key={p.id}>
                  {i > 0 && (
                    <div aria-hidden className="mx-5 h-px bg-line-default" />
                  )}
                  <div className="flex items-center gap-3 px-5 py-3">
                    <Thumb>
                      <Image
                        src={p.image ?? "/common/no-photo.png"}
                        width={128}
                        height={128}
                        sizes="64px"
                        alt=""
                      />
                    </Thumb>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      {p.brand && (
                        <span className="text-body2 text-text-sub">
                          {p.brand}
                        </span>
                      )}
                      <span className="line-clamp-2 text-body1-medium text-text-strong">
                        {nameWithoutBrand(p.name, p.brand)}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusTag status="noScore" />
                      <Button kind="tertiary" size="S" asChild>
                        <Link href={`/contribute/label?product=${p.id}`}>
                          찍기
                          <span className="sr-only">
                            ({nameWithoutBrand(p.name, p.brand)} 영양성분표)
                          </span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </>
    );

  return (
    <>
      {groupRequests(requests).map((group) => (
        <section key={group.key} aria-labelledby={`requests-${group.key}`}>
          <div aria-hidden className="h-2 bg-bg-band" />
          <h2
            id={`requests-${group.key}`}
            className="flex items-center gap-1.5 px-5 pt-5 pb-1"
          >
            <span className="text-body1-bold text-text-strong">
              {group.title}
            </span>
            <span className="text-body2-medium text-text-sub">
              {group.items.length}
              <span className="sr-only">개</span>
            </span>
          </h2>
          <ul>
            {group.items.map((request, i) => (
              <li key={request.id}>
                {i > 0 && (
                  <div aria-hidden className="mx-5 h-px bg-line-default" />
                )}
                <RequestRow request={request} now={now} />
                {request.status === "FAILED" && (
                  <div className="flex items-center gap-2 px-5 pb-3">
                    <span className="flex-1 text-caption text-text-sub">
                      사진으로 숫자를 읽지 못했어요
                    </span>
                    <Link
                      href={`/contribute/label${request.query ? `?${request.query}` : ""}`}
                      className="text-caption-bold text-brand-link"
                    >
                      다시 찍기 <span aria-hidden>›</span>
                      <span className="sr-only">
                        ({nameWithoutBrand(request.name, request.brand)})
                      </span>
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="min-h-2 flex-1" />
      <div className="sticky bottom-[calc(57px+var(--safe-bottom))] flex gap-2 bg-bg-page px-5 pt-2 pb-9 *:flex-1">
        {buttons}
      </div>
    </>
  );
}

function RequestRow({ request, now }: { request: RequestItem; now: Date }) {
  const href = requestHref(request);
  const body = (
    <>
      <Thumb>
        <Image
          src={request.image ?? "/common/no-photo.png"}
          width={128}
          height={128}
          sizes="64px"
          alt=""
        />
      </Thumb>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body2 text-text-sub">
          {[request.brand, KIND_LABEL[request.kind]]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <span className="line-clamp-2 text-body1-medium text-text-strong">
          {nameWithoutBrand(request.name, request.brand)}
        </span>
        <span className="text-body2 text-text-sub">
          {describeRequest(request, now)}
        </span>
      </span>
      <StatusTag status={STATUS_TAG[request.status]} className="shrink-0" />
    </>
  );
  const rowClass = "flex items-center gap-3 px-5 py-3";
  return href ? (
    <Link href={href} className={rowClass}>
      {body}
    </Link>
  ) : (
    <div className={rowClass}>{body}</div>
  );
}
