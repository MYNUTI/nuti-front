import { ProductLoading } from "../product-loading";

// 상세 조회를 기다리는 동안. 확인은 ?state=loading으로도 한다
export default function Loading() {
  return <ProductLoading />;
}
