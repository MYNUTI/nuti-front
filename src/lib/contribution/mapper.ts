import type {
  AnalysisRequest,
  AnalysisRequestCreateDto,
  AnalysisRequestDto,
  AnalysisRequestInput,
  ReportCreateResult,
  ReportCreateResultDto,
} from "@/lib/contribution/types";

export function toAnalysisRequestBody(
  input: AnalysisRequestInput,
): AnalysisRequestCreateDto {
  if (input.type === "NUTRITION_FILL")
    return { type: input.type, productId: Number(input.productId) };
  return input;
}

export function toAnalysisRequest(dto: AnalysisRequestDto): AnalysisRequest {
  return { ...dto, requestId: String(dto.requestId) };
}

export function toReportCreateResult(
  dto: ReportCreateResultDto,
): ReportCreateResult {
  return { ...dto, reportIds: dto.reportIds.map(String) };
}
