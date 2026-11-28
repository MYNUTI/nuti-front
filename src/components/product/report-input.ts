import { ApiError } from "@/lib/api/errors";
import type {
  ReportCreateResult,
  ReportInput,
  ReportType,
} from "@/lib/contribution/types";

/** 정보가 틀렸어요 시트의 항목. 화면 순서대로 */
export const REPORT_REASONS = [
  { key: "other-product", label: "다른 제품이 나와요", type: "WRONG_PRODUCT" },
  {
    key: "name-photo",
    label: "제품 이름이나 사진이 달라요",
    type: "NAME_OR_IMAGE",
  },
  { key: "nutrition", label: "영양성분 값이 포장과 달라요", type: "NUTRITION" },
  { key: "etc", label: "그 밖의 문제", type: "OTHER" },
] as const satisfies readonly {
  key: string;
  label: string;
  type: ReportType;
}[];

export type ReportReasonKey = (typeof REPORT_REASONS)[number]["key"];

/** 고른 항목이 없으면 보내지 않는다(null) */
export function toReportInput({
  productId,
  barcode,
  picked,
  detail,
}: {
  productId: string;
  barcode?: string;
  picked: ReadonlySet<ReportReasonKey>;
  detail: string;
}): ReportInput | null {
  const [first, ...rest] = REPORT_REASONS.filter((r) => picked.has(r.key)).map(
    (r) => r.type,
  );
  if (first === undefined) return null;
  const content = detail.trim();
  return {
    productId,
    reportTypes: [first, ...rest],
    ...(content && { content }),
    ...(barcode && { barcode }),
  };
}

/**
 * 「그 밖의 문제」는 서버가 자세한 내용을 필수로 받는다(빈 내용은 400). 디자인 · 명세는 선택이라 백엔드에 바꿔
 * 달라고 할 때까지 화면에서 먼저 막는다(API 플랜 「남은 질문」)
 */
export function needsDetail(
  picked: ReadonlySet<ReportReasonKey>,
  detail: string,
) {
  return picked.has("etc") && detail.trim() === "";
}

export const REPORT_DETAIL_MAX_LENGTH = 1000;

const NETWORK_FAILED =
  "보내지 못했어요. 인터넷 연결을 확인하고 다시 보내 주세요. 고른 내용은 그대로 있어요.";

/**
 * 보내기 실패 문장. 서버가 거절했으면(4xx: 하루 10건 한도 · 없는 제품 · 내용 길이) 다시 보내도 같아 서버 문구를 보인다.
 * 응답이 없거나 서버 오류(5xx)면 다시 보내 볼 수 있어 디자인 문장이다
 */
export function reportFailMessage(error: unknown) {
  return error instanceof ApiError &&
    error.status !== null &&
    error.status < 500
    ? error.message
    : NETWORK_FAILED;
}

/** 고른 항목이 전부 아직 확인 중이면 서버가 새로 만들지 않는다(`duplicate`). 일부만 겹치면 나머지는 접수돼 고맙다고 한다 */
export function reportSentMessage(
  result: Pick<ReportCreateResult, "duplicate">,
) {
  return result.duplicate
    ? "이미 보내 주신 내용이에요. 확인 중이에요."
    : "보내 주셔서 고마워요. 확인 결과는 기록 › 분석 요청에서 볼 수 있어요.";
}
