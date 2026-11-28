/*
 * 검색 로그(`POST /logging/search`)를 언제 보낼지. 인기 검색어 · 일별 검색 통계가 이 로그로만 모인다.
 * 보낸다: 검색칸에서 검색해 결과로 왔을 때, 페이지를 처음 연(새로고침 · 공유 링크) 결과 화면.
 * 보내지 않는다: 앱 안에서 뒤로 · 앞으로 돌아와 결과 화면이 다시 붙을 때(같은 검색이 부풀지 않게).
 */

// 검색칸에서 검색해 결과로 가는 중인 검색어. 결과 화면이 받아 지운다
let pending: string | null = null;
// 이 문서(페이지 로드)에서 아직 결과 화면이 붙은 적이 없다
let documentEntry = true;

/** 검색칸 · 칩에서 검색해 결과로 갈 때 부른다 */
export function markSearchLog(query: string) {
  pending = query;
}

/** 결과 화면이 붙을 때 이 검색어의 로그를 보낼지. 값만 읽는다(StrictMode에서 두 번 불러도 같다) */
export function shouldLogSearch(query: string) {
  return pending === query || documentEntry;
}

/** 결과 화면이 붙은 뒤 한 번 부른다. 다음에 붙는 결과 화면(뒤로 · 앞으로)은 로그를 보내지 않는다 */
export function settleSearchLog(query: string) {
  documentEntry = false;
  if (pending === query) pending = null;
}
