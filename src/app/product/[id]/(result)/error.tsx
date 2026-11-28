"use client";

import { ProductError } from "../product-error";

// 상세 조회가 실패했을 때. 확인은 ?state=error로도 한다
export default function Error({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <ProductError onRetry={retry} />;
}
