import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import {
  toAnalysisRequest,
  toAnalysisRequestBody,
} from "@/lib/contribution/mapper";
import type {
  AnalysisRequestDto,
  AnalysisRequestInput,
  InquiryCreateDto,
  InquiryDto,
} from "@/lib/contribution/types";

/**
 * 분석이 끝난 상품은 409 `ALREADY_ANALYZED`, 검색어 접수가 하루 5건을 넘으면 429 `DAILY_LIMIT_EXCEEDED`,
 * 없는 상품은 404 `PRODUCT_NOT_FOUND`. 식별값이 없거나 바코드 형식이 틀리거나 검색어가 30자를 넘으면
 * 400 `BAD_REQUEST`, 바코드 체크섬이 틀리면 400 `BARCODE_CHECKSUM_INVALID`
 */
export function postAnalysisRequest(
  http: AxiosInstance,
  input: AnalysisRequestInput,
) {
  return http
    .post<ApiSuccess<AnalysisRequestDto>>(
      "/analysis-requests",
      toAnalysisRequestBody(input),
    )
    .then(unwrap)
    .then(toAnalysisRequest);
}

/**
 * 화면 진입점이 정해지지 않아 API 함수만 둔다. 내용이 비었거나 1000자를 넘거나 이메일 형식이 틀리면 400,
 * 하루 3건을 넘으면 429 `DAILY_LIMIT_EXCEEDED`
 */
export function postInquiry(http: AxiosInstance, body: InquiryCreateDto) {
  return http
    .post<ApiSuccess<InquiryDto>>("/support/inquiries", body)
    .then(unwrap);
}
