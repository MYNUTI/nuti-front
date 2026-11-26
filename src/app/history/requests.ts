/*
 * 4-3 내 기록(분석 요청)의 묶음 · 줄 설명 · 이동할 곳(【최종】 4-3 메모). 화면과 떼어 테스트한다.
 * 서버 상태: 분석 요청은 분석 중 · 확인 중 · 완료 · 분석 못 함, 정보 수정 요청은 확인 중 · 완료 · 반영하지 않음.
 */
import type { Status } from "@/components/common/status-tag";

import { seoulDay } from "./history-days";

export type RequestKind = "analysis" | "correction";
export type RequestStatus =
  "ANALYZING" | "CHECKING" | "DONE" | "FAILED" | "REJECTED";

export type RequestItem = {
  id: string;
  kind: RequestKind;
  status: RequestStatus;
  brand: string | null;
  name: string;
  image: string | null;
  sentAt: string;
  /** 분석 요청을 어떻게 보냈나(이름만 · 영양성분표 사진 · 사진에서 읽은 값) */
  via: "name" | "photo" | "values";
  /** 결과를 볼 제품(3-2). 확인 중 분석 요청은 3-9로 */
  productId: string | null;
  /** 3-9 · 3-7로 넘길 주소 값(`product=` 등) */
  query: string;
};

export const KIND_LABEL: Record<RequestKind, string> = {
  analysis: "분석 요청",
  correction: "정보 수정 요청",
};

export const STATUS_TAG: Record<RequestStatus, Status> = {
  ANALYZING: "analyzing",
  CHECKING: "checking",
  DONE: "complete",
  // 메모: 반영하지 않은 정보 수정 요청은 「완료」 묶음
  REJECTED: "complete",
  FAILED: "failed",
};

const GROUPS = [
  { key: "failed", title: "분석 못 한 요청", statuses: ["FAILED"] },
  { key: "processing", title: "처리 중", statuses: ["ANALYZING", "CHECKING"] },
  { key: "done", title: "완료", statuses: ["DONE", "REJECTED"] },
] as const satisfies readonly {
  key: string;
  title: string;
  statuses: readonly RequestStatus[];
}[];

/** 세 묶음(이 순서), 묶음 안은 보낸 시각이 최신인 것부터. 요청이 없는 묶음은 뺀다 */
export function groupRequests(requests: readonly RequestItem[]) {
  return GROUPS.map((group) => ({
    key: group.key,
    title: group.title,
    items: requests
      .filter((r) => (group.statuses as readonly string[]).includes(r.status))
      .toSorted((a, b) => b.sentAt.localeCompare(a.sentAt)),
  })).filter((group) => group.items.length > 0);
}

function monthDay(at: string, now: Date) {
  const day = seoulDay(at);
  const [year, month, date] = day.split("-").map(Number);
  const sameYear = day.slice(0, 4) === seoulDay(now).slice(0, 4);
  return `${sameYear ? "" : `${year}년 `}${month}월 ${date}일`;
}

/** 줄 설명 한 줄 */
export function describeRequest(request: RequestItem, now: Date) {
  const date = monthDay(request.sentAt, now);
  if (request.kind === "correction") {
    if (request.status === "DONE") return "영양성분 값을 고쳤어요";
    if (request.status === "REJECTED")
      return "확인해 보니 지금 정보가 맞았어요.";
    return `${date}에 보냈어요`;
  }
  if (request.status === "CHECKING") return "내가 찍은 값으로 낸 점수예요";
  if (request.status === "DONE") return "점수가 나왔어요";
  return `${request.via === "name" ? "이름으로 요청" : "영양성분표 사진"}, ${date}`;
}

/** 줄을 누르면 갈 곳. null이면 누르는 곳이 아니다(분석 중 · 분석 못 함) */
export function requestHref(request: RequestItem) {
  if (request.status === "ANALYZING" || request.status === "FAILED")
    return null;
  if (request.kind === "analysis" && request.status === "CHECKING")
    return `/contribute/score${request.query ? `?${request.query}` : ""}`;
  return request.productId ? `/product/${request.productId}` : null;
}
