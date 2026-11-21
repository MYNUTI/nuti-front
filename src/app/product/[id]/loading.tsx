import { ProductLoading } from "./product-loading";

// 상세 조회를 기다리는 동안(API 연결 뒤). 지금 fixture는 바로 그려져 확인은 ?state=loading으로 한다
export default function Loading() {
  return <ProductLoading />;
}
