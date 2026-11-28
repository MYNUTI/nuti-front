import type { Metadata } from "next";

import { readServerDeviceGoal } from "@/lib/goal/device.server";

import { MAX_QUERY_LENGTH, readResultParams } from "./result-params";
import { SearchScreen } from "./search-screen";

export const metadata: Metadata = { title: "검색" };

/*
 * 2-3 검색 · 2-4 검색 결과(같은 주소, 검색어는 ?q=).
 * 2-4는 정렬 · 불러온 개수를 ?sort= · ?n=에 남겨 상세에서 뒤로 와도 되살린다(결과 화면이 쓴다).
 * 내 목표는 서버가 기기 쿠키로 읽어 넘긴다(고른 적이 없으면 다이어트, ONB_008). 「목표: ○○」가 처음부터 맞게 보인다.
 * 미리보기용 주소 값: ?state=error — 2-4 「검색 결과를 불러오지 못했어요」
 */
export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const { q, state, sort, n } = await searchParams;
  // 서버가 30자를 넘으면 거절해 주소로 들어온 긴 검색어는 자른다(입력 칸도 30자로 막는다)
  const query =
    typeof q === "string" ? q.trim().slice(0, MAX_QUERY_LENGTH).trim() : "";
  const restored = readResultParams((name) => {
    const value = name === "sort" ? sort : n;
    return typeof value === "string" ? value : null;
  });
  // 검색어가 바뀌면 입력 상태 · 정렬을 새로 시작한다(【최종】 메모: 2-4는 새 검색어를 치면 기본 정렬로)
  return (
    <SearchScreen
      key={query}
      initialQuery={query}
      initialSort={restored.sort}
      initialShown={restored.shown}
      failed={state === "error"}
      goal={(await readServerDeviceGoal()) ?? "WEIGHT_LOSS"}
    />
  );
}
