import "server-only";
import { cache } from "react";
import { serverApi } from "@/lib/api/server";
import { fetchRankingCategories } from "@/lib/ranking/api";

/**
 * 2-2 서버 렌더용 분류(대분류 15개 + 순위가 열린 칩). 없는 칩 주소의 404, 제목, 대분류 · 칩 이름에 쓴다.
 * 같은 렌더의 `generateMetadata`와 페이지가 한 번만 부르게 React `cache()`로 감싼다
 */
export const getRankingCategories = cache(() =>
  fetchRankingCategories(serverApi),
);
