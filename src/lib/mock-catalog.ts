import type { Grade } from "@/lib/grade";

export type Nutrient = { label: string; value: string; note?: string };

export type Product = {
  /** 내부 상품 ID. `/product/[id]` 라우팅에 쓴다 — GTIN이 아니다. */
  id: string;
  name: string;
  /** 정규화된 GTIN-14. 스캔 조회의 인덱스 키다. */
  gtin: string;
  grade: Grade;
  /** 등급을 사람 말로 옮긴 한 줄. 등급→문구 매핑이 B·E까지 확정되면 파생시킨다. */
  verdict: string;
  /** 스캔 시트처럼 좁은 자리에 쓰는 한 줄 요약. */
  summary: string;
  nutrients: readonly Nutrient[];
};

/**
 * 조회 API가 붙기 전까지 쓰는 목 카탈로그.
 *
 * 스캔 시트·홈 최근 목록·상세가 모두 여기를 읽는다. 사본을 만들면 같은 상품이 화면마다
 * 다른 등급으로 보이므로 늘리지 않는다.
 *
 * TODO: 공개 배포 전에 실 API로 교체한다. 등급은 서버 값만 쓴다는 원칙과 달리 이 목은
 * 실재할 수 있는 GTIN에 지어낸 등급을 붙인다.
 */
const PRODUCTS: readonly Product[] = [
  {
    id: "1",
    name: "더단백 라떼 350ml",
    gtin: "08801062633029",
    grade: "D",
    verdict: "잘 안 맞아요",
    summary: "당류 21g — 감량 기준 초과",
    nutrients: [
      { label: "당류", value: "21g", note: "감량 기준 초과" },
      { label: "단백질", value: "12g" },
      { label: "나트륨", value: "180mg" },
    ],
  },
  {
    id: "2",
    name: "잇더핏 프로틴 190ml",
    gtin: "04006381333931",
    grade: "A",
    verdict: "잘 맞아요",
    summary: "단백질 20g — 감량 기준 충족",
    nutrients: [
      { label: "당류", value: "2g" },
      { label: "단백질", value: "20g" },
      { label: "나트륨", value: "90mg" },
    ],
  },
];

/**
 * Map으로 조회한다. 평범한 객체는 `obj["toString"]`이 프로토타입 메서드를 돌려주므로,
 * URL 세그먼트를 그대로 키로 쓰면 없는 상품이 truthy로 통과해 렌더가 터진다.
 */
const BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));
const BY_GTIN = new Map(PRODUCTS.map((product) => [product.gtin, product]));

export function findProductById(id: string): Product | undefined {
  return BY_ID.get(id);
}

export function findProductByGtin(gtin: string): Product | undefined {
  return BY_GTIN.get(gtin);
}

/** 홈 「최근 본 제품」처럼 카탈로그 전체가 필요한 자리에서 쓴다. */
export const ALL_PRODUCTS = PRODUCTS;

/** 테스트 전용 — 목 키가 정규화 규칙과 어긋나면 조회가 조용히 전부 not-found가 된다. */
export const MOCK_PRODUCT_GTINS = PRODUCTS.map((product) => product.gtin);
