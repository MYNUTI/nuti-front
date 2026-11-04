import type {
  AnalysisRequest,
  AnalysisRequestCreateDto,
  AnalysisRequestDto,
  AnalysisRequestInput,
} from "@/lib/contribution/types";

export function toAnalysisRequestBody(
  input: AnalysisRequestInput,
): AnalysisRequestCreateDto {
  if (input.type === "NUTRITION_FILL")
    return { type: input.type, productId: Number(input.productId) };
  return "barcode" in input
    ? { type: input.type, barcode: input.barcode }
    : { type: input.type, keyword: input.keyword };
}

export function toAnalysisRequest(dto: AnalysisRequestDto): AnalysisRequest {
  return { ...dto, requestId: String(dto.requestId) };
}
