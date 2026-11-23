import type { AxiosInstance } from "axios";
import { unwrap } from "@/lib/api/response";
import type { ApiSuccess } from "@/lib/api/types";
import {
  toAnalysisRequest,
  toAnalysisRequestBody,
  toReportCreateResult,
} from "@/lib/contribution/mapper";
import type {
  AnalysisRequestDto,
  AnalysisRequestInput,
  ReportCreateDto,
  ReportCreateResultDto,
  ReportInput,
} from "@/lib/contribution/types";

/**
 * 분석이 끝난 상품은 409 `ALREADY_ANALYZED`, 검색어·제품명 요청이 합쳐 하루 5건을 넘으면 429
 * `DAILY_LIMIT_EXCEEDED`, 없는 상품은 404 `PRODUCT_NOT_FOUND`. 식별값이 없거나 길이·형식이 틀리면 400
 * `BAD_REQUEST`, 바코드 체크섬이 틀리면 400 `BARCODE_CHECKSUM_INVALID`
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
 * 3-2 「정보가 틀렸어요」. 비로그인도 된다. OTHER를 골랐는데 내용이 없거나 1000자를 넘으면 400
 * `BAD_REQUEST`, 하루 10건을 넘으면 429 `DAILY_LIMIT_EXCEEDED`, 없거나 비활성 상품은 404 `PRODUCT_NOT_FOUND`
 */
export function postProductReport(
  http: AxiosInstance,
  { productId, ...body }: ReportInput,
) {
  return http
    .post<ApiSuccess<ReportCreateResultDto>>(
      `/products/${encodeURIComponent(productId)}/reports`,
      body satisfies ReportCreateDto,
    )
    .then(unwrap)
    .then(toReportCreateResult);
}
