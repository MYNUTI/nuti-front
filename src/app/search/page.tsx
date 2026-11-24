import type { Metadata } from "next";

import { SearchScreen } from "./search-screen";

export const metadata: Metadata = { title: "검색" };

/*
 * 2-3 검색 · 2-4 검색 결과(같은 주소, 검색어는 ?q=). 2-4는 다음 화면 작업에서 붙인다.
 * 지금은 ?q=가 있으면 그 말을 넣은 채 2-3(입력 중)으로 연다
 */
export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  // 검색어가 바뀌면 입력 상태를 새로 시작한다
  return <SearchScreen key={query} initialQuery={query} />;
}
