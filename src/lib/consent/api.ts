import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import type {
  ConsentChangeDto,
  ConsentItemsDto,
  ConsentsDto,
  OptionalConsentItemCode,
} from "@/lib/consent/types";

/** 로그인이 필요 없다 */
export function fetchConsentItems(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<ConsentItemsDto>>("/meta/consent-items", { signal })
    .then(unwrap);
}

/** 로그인 전용. 토큰이 없으면 401 */
export function fetchMyConsents(http: AxiosInstance, signal?: AbortSignal) {
  return http
    .get<ApiSuccess<ConsentsDto>>("/me/consents", { signal })
    .then(unwrap)
    .then((dto) => dto.items);
}

/**
 * 로그인 전용(401). 선택 항목만 바꿀 수 있다. 같은 상태면 기록하지 않고 그대로 돌려준다. 철회하면 그 동의로
 * 저장한 데이터(계정 목표, 몸 정보·칼로리 구간)를 서버가 바로 지운다
 */
export function putConsent(
  http: AxiosInstance,
  item: OptionalConsentItemCode,
  body: ConsentChangeDto,
) {
  return http
    .put<ApiSuccess<ConsentsDto>>(
      `/me/consents/${encodeURIComponent(item)}`,
      body,
    )
    .then(unwrap)
    .then((dto) => dto.items);
}
