/*
 * 홈 임시 데이터. API 연결 전까지 쓰고, 연결할 때 이 import를 쿼리 훅으로 바꾼다(UI 플랜 「데이터」).
 * 값은 디자인 2-1 홈(첫 방문·사용 중) 그대로다.
 */
import type { ScoreBand } from "@/components/common/score-ring";

export type Goal = "diet" | "muscle";

export type PopularProduct = {
  id: string;
  brand: string;
  name: string;
  image: string;
  imageSize: number;
  score: number;
  band: ScoreBand;
  tags: { label: string; warn?: boolean }[];
};

export const FIXTURE_GOAL: Goal = "diet";

/** 최근 본 제품 요약(사용 중 목표 카드). bands는 점수 구간별 개수 */
export type RecentSummary = {
  total: number;
  matched: number;
  bands: Record<ScoreBand, number>;
  requests: number;
};

export const FIXTURE_RECENT: RecentSummary = {
  total: 12,
  matched: 8,
  bands: { 1: 5, 2: 3, 3: 2, 4: 1, 5: 1 },
  requests: 3,
};

export const FIXTURE_POPULAR: PopularProduct[] = [
  {
    id: "1",
    brand: "커클랜드 시그니처",
    name: "프로틴바 초콜릿 브라우니",
    image: "/fixtures/product-1.png",
    imageSize: 800,
    score: 92,
    band: 1,
    tags: [
      { label: "고포화지방", warn: true },
      { label: "고단백" },
      { label: "저당" },
    ],
  },
  {
    id: "2",
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
