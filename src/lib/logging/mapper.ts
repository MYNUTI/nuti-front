import type {
  ImpressionInput,
  ImpressionLogDto,
  ScanEventInput,
  ScanEventLogDto,
} from "@/lib/logging/types";

export function toImpressionBody(input: ImpressionInput): ImpressionLogDto {
  const items = input.items.map((item) => ({
    productId: Number(item.productId),
    position: item.position,
  }));
  return input.surface === "SEARCH"
    ? { surface: input.surface, keyword: input.keyword, items }
    : { surface: input.surface, items };
}

export function toScanEventBody(input: ScanEventInput): ScanEventLogDto {
  return input.result === "NOT_IN_DATA" || input.result === "CHECKSUM_FAIL"
    ? { result: input.result, barcode: input.barcode, surface: input.surface }
    : { result: input.result, surface: input.surface };
}
