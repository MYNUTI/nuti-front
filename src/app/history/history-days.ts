/*
 * 4-1 기록을 날짜별로 묶는다(메모: 「오늘, 어제 …」). 서버 시간대와 상관없이 한국 날짜로 나눈다.
 */
const DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 한국 날짜 `YYYY-MM-DD` */
export function seoulDay(at: Date | string) {
  return DAY.format(typeof at === "string" ? new Date(at) : at);
}

function previousDay(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** 「오늘」 · 「어제」 · 「11월 24일」 · 해가 다르면 「2025년 12월 3일」 */
export function dayLabel(day: string, today: string) {
  if (day === today) return "오늘";
  if (day === previousDay(today)) return "어제";
  const [year, month, date] = day.split("-").map(Number);
  const prefix = day.slice(0, 4) === today.slice(0, 4) ? "" : `${year}년 `;
  return `${prefix}${month}월 ${date}일`;
}

/** 같은 날끼리 묶는다. 묶음 순서는 그날이 처음 나온 순서(최근 먼저로 오면 최근 날부터) */
export function groupByDay<T extends { viewedAt: string }>(
  items: readonly T[],
  now: Date,
) {
  const today = seoulDay(now);
  const groups: { day: string; label: string; items: T[] }[] = [];
  for (const item of items) {
    const day = seoulDay(item.viewedAt);
    // 순서가 섞여 와도 같은 날이 두 묶음으로 나뉘지 않게 이미 만든 묶음에서 찾는다
    const found = groups.find((g) => g.day === day);
    if (found) found.items.push(item);
    else groups.push({ day, label: dayLabel(day, today), items: [item] });
  }
  return groups;
}
