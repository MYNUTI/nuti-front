import type { Gtin, ScanResult } from "@/lib/scan/types";

export type LookupOutcome =
  | { status: "found"; result: ScanResult }
  /** 정상 응답이다. 갈 상세 페이지가 없으므로 IA 3-6 미등록 화면으로 보내야 한다. */
  | { status: "not-found"; gtin: Gtin };

/**
 * GTIN으로 상품을 찾는다.
 *
 * 상세는 내부 상품 ID로 라우팅하므로(`/product/[id]`) 조회 없이 상세로 가는 경로는 없다.
 * 카메라·사진·직접 입력 모두 이 포트를 거친다.
 *
 * 네트워크 실패는 결과에 담지 않고 reject한다 — 재시도와 에러 상태는 TanStack Query가
 * 맡는다. "없음"은 실패가 아니므로 결과로 구분한다.
 */
export type LookupProduct = (
  gtin: Gtin,
  signal?: AbortSignal,
) => Promise<LookupOutcome>;

/**
 * 조회 API가 붙기 전까지 쓰는 목. 키는 정규화된 GTIN-14다.
 *
 * TODO: 공개 배포 전에 반드시 실 API로 교체한다. 등급은 서버 값만 쓴다는 원칙과 달리
 * 이 목은 실재할 수 있는 GTIN에 지어낸 등급을 붙인다. 환경으로 막지 않은 이유는 지금의
 * noindex 미리보기 배포에서 결과 화면을 시연할 수 있어야 하기 때문이다.
 */
const MOCK_PRODUCTS: Readonly<Record<Gtin, ScanResult>> = {
  "08801062633029": {
    id: "1",
    name: "더단백 라떼 350ml",
    summary: "당류 21g — 감량 기준 초과",
    grade: "D",
  },
  "04006381333931": {
    id: "2",
    name: "잇더핏 프로틴 190ml",
    summary: "단백질 20g — 감량 기준 충족",
    grade: "A",
  },
};

export const lookupProduct: LookupProduct = async (gtin) => {
  const result = MOCK_PRODUCTS[gtin];
  return result ? { status: "found", result } : { status: "not-found", gtin };
};

/** 테스트 전용 — 목 키가 정규화 규칙과 어긋나면 조회가 조용히 전부 not-found가 된다. */
export const MOCK_PRODUCT_GTINS = Object.keys(MOCK_PRODUCTS);
