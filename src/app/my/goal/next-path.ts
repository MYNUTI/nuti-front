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

const NEXT_SCREEN: Record<string, string> = {
  home: "2-1",
  search: "2-4",
  ranking: "2-2",
};

/** 5-2에 들어온 화면 코드(이벤트 `from_screen`). 돌아갈 주소(?next=)가 없으면 5-1에서 왔다 */
export function goalPickerFrom(next: string | undefined) {
  if (!next) return "5-1";
  const segment = new URL(next, "http://local").pathname.split("/")[1];
  return NEXT_SCREEN[segment] ?? "5-1";
}

/**
 * 홈 · 검색 결과 · 랭킹의 「목표: ○○」 → 5-2 목표 바꾸기 주소. 돌아올 지금 주소(?next=)를 넘긴다. 목표는 기기에 있어 넘기지 않는다.
 * 돌아올 주소가 받는 화면 모양이 아니면 next를 빼고 5-2를 연다(그러면 바꾼 뒤 5-1로 간다)
 */
export function goalPickerHref(currentPath: string) {
  const params = new URLSearchParams();
  const current = new URL(currentPath, "http://local");
  // 한 번만 띄우는 알림 값은 돌아올 주소에서 뺀다(계정 삭제 뒤 홈 「계정을 삭제했어요」가 다시 뜨지 않게)
  if (current.searchParams.get("state") === "deleted")
    current.searchParams.delete("state");
  const next = toGoalNextPath(`${current.pathname}${current.search}`);
  if (next) params.set("next", next);
  const query = params.toString();
  return `/my/goal${query ? `?${query}` : ""}`;
}
