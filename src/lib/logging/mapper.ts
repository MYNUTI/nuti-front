import type { ScanEventInput, ScanEventLogDto } from "@/lib/logging/types";

export function toScanEventBody(input: ScanEventInput): ScanEventLogDto {
  return input.result === "NOT_IN_DATA" || input.result === "CHECKSUM_FAIL"
    ? { result: input.result, barcode: input.barcode, surface: input.surface }
    : { result: input.result, surface: input.surface };
}
