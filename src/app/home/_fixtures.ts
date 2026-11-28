/*
 * 홈 임시 데이터. API 연결 전까지 쓰고, 연결할 때 이 import를 쿼리 훅으로 바꾼다(UI 플랜 「데이터」).
 * 값은 디자인 2-1 홈(첫 방문·사용 중) 그대로다. 단 카드 점수는 3-2 제품 결과 fixture와 같게 둔다(같은 제품이 화면마다 다른 점수로 보이지 않게).
 */
import type { ProductCardItem } from "@/components/common/product-card";

export type Goal = "diet" | "muscle";

export type PopularProduct = ProductCardItem;

export const FIXTURE_POPULAR: PopularProduct[] = [
  {
    id: "5",
    brand: "커클랜드 시그니처",
    name: "프로틴바 초콜릿 브라우니",
    image: "/fixtures/product-1.png",
    imageSize: 800,
    score: 92,
    band: 1,
    // 【최종】: 걸리는 성분 태그는 맨 뒤
    tags: [
      { label: "고단백" },
      { label: "저당" },
      { label: "고포화지방", warn: true },
    ],
  },
  {
    id: "11",
    brand: "마이프로틴",
    name: "하이프로틴바 초콜렛 오렌지",
    image: "/fixtures/product-2.png",
    imageSize: 400,
    score: 89,
    band: 1,
    tags: [{ label: "고단백" }, { label: "저당" }],
  },
  {
    id: "3",
    brand: "칼만스",
    name: "프로틴바 솔티드 다크초코&아몬드",
    image: "/fixtures/product-3.png",
    imageSize: 400,
    score: 86,
    band: 1,
    tags: [{ label: "고단백" }],
  },
];

/** 「?state=compare」 미리 보기용 비교함 안내 줄 값(디자인 그대로) */
export const FIXTURE_COMPARE_NOTICE = { addedLabel: "어제", count: 2 };
