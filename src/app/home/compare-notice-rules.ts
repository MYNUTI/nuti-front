/*
 * 2-1 홈 「담아 둔 비교함」 안내 줄을 띄울지 정하는 규칙(【최종】 메모).
 * 비교함에 담은 지 24시간이 지난 뒤 홈을 다시 열 때 한 번만 보인다. 그 뒤로는 다시 띄우지 않는다.
 * 「한 번」은 안내를 띄운 시각으로 가린다. 그때 있던 제품(띄운 시각보다 먼저 담긴 것)이 하나라도 남아 있으면
 * 같은 묶음이라 다시 뜨지 않는다(더 담거나 일부를 빼도). 비교함을 비우고 새로 담으면 그 묶음으로 다시 한 번 뜬다.
 */
export const NOTICE_AFTER_MS = 24 * 60 * 60 * 1000;

export type CompareNotice = {
  /** 「어제」 · 「3일 전에」 */
  addedLabel: string;
  count: number;
};

export function compareNotice(
  items: readonly { addedAt: number }[],
  now: number,
  /** 안내를 마지막으로 띄운 시각 */
  seenAt: number | null,
): CompareNotice | null {
  if (items.length === 0) return null;
  const oldest = Math.min(...items.map((item) => item.addedAt));
  if (now - oldest < NOTICE_AFTER_MS) return null;
  if (seenAt !== null && oldest <= seenAt) return null;
  return { addedLabel: addedLabel(oldest, now), count: items.length };
}

// 디자인은 「어제」만 그렸다. 이틀 넘게 지나면 「N일 전에」로 쓴다(정한 값)
export function addedLabel(at: number, now: number): string {
  const days = koreanDay(now) - koreanDay(at);
  return days <= 1 ? "어제" : `${days}일 전에`;
}

// 한국 날짜(자정 기준)의 일련번호. 서버 · 기기 시간대와 상관없이 날짜가 바뀌는 때를 맞춘다
function koreanDay(time: number): number {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(time)
    .split("-")
    .map(Number);
  return Date.UTC(year, month - 1, day) / NOTICE_AFTER_MS;
}
