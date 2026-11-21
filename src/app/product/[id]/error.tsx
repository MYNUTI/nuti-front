"use client";

import { ProductError } from "./product-error";

// 상세 조회가 실패했을 때(API 연결 뒤). 지금 fixture는 실패하지 않아 확인은 ?state=error로 한다
export default function Error({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <ProductError onRetry={retry} />;
}
