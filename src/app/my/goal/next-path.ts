import type { Goal } from "../_fixtures";

// 【최종】 5-2 메모: 홈 · 검색 결과 · 랭킹의 「목표: ○○」에서 들어왔으면 그 화면으로 돌아간다. 다른 주소로 보내지 않게 이 셋만 받는다
const NEXT_PATTERN = /^\/(?:home|search|ranking)(?:[/?]|$)/;

/** 5-2에서 목표를 바꾼 뒤 돌아갈 주소(?next=). 받는 화면 주소 모양이 아니면 버린다 */
export function toGoalNextPath(value: string | string[] | undefined) {
  if (typeof value !== "string" || !NEXT_PATTERN.test(value)) return undefined;
  // `..` · `\` · `%2e`가 정규화되면 다른 경로나 `//다른 사이트`가 된다(`/home/..//evil` → `//evil`). 정규화한 결과로 다시 본다
  const url = new URL(value, "http://local");
  const path = `${url.pathname}${url.search}`;
  return url.origin === "http://local" && NEXT_PATTERN.test(path)
    ? path
    : undefined;
}

/** 돌아갈 주소에 새 목표(?goal=)를 붙인다. 이미 있던 goal은 바꾸고 나머지 값(검색어 등)은 둔다 */
export function withGoal(path: string, goal: Goal) {
  const url = new URL(path, "http://local");
  url.searchParams.set("goal", goal);
  return `${url.pathname}${url.search}`;
}
