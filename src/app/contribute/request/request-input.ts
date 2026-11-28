import { isRejectedByServer } from "@/lib/api/errors";
import type { AnalysisRequestInput } from "@/lib/contribution/types";
import type { Gtin } from "@/lib/scan/types";

// 서버가 이보다 길면 400으로 거절한다(백엔드 `AnalysisRequest.NAME_MAX_LENGTH` · `BRAND_MAX_LENGTH`)
export const NAME_MAX_LENGTH = 100;
export const BRAND_MAX_LENGTH = 50;

export const NETWORK_FAILED =
  "보내지 못했어요. 인터넷 연결을 확인하고 다시 보내 주세요. 적은 내용은 그대로 있어요.";

/**
 * 보내기 실패 문장. 서버가 거절했으면(4xx: 하루 5건 한도 등) 다시 보내도 같아 서버 문구를, 응답이 없거나 서버 오류(5xx)면
 * 다시 보내 볼 수 있어 디자인 문장을 보인다(3-2 정보가 틀렸어요와 같은 규칙)
 */
export function requestFailMessage(error: unknown) {
  return isRejectedByServer(error) ? error.message : NETWORK_FAILED;
}

/** 3-6 제품 요청하기 본문. 빈 브랜드 · 어디서 왔는지가 없으면 싣지 않는다 */
export function toRequestInput({
  name,
  brand,
  gtin,
  originKeyword,
}: {
  name: string;
  brand: string;
  gtin: Gtin | null;
  originKeyword: string | null;
}): AnalysisRequestInput {
  const brandName = brand.trim();
  return {
    type: "NEW_PRODUCT",
    productName: name.trim(),
    ...(brandName && { brandName }),
    ...(gtin && { originBarcode: gtin }),
    ...(originKeyword && { originKeyword }),
  };
}
