/** 「11월 5일 16:00 업데이트」. 서버 시각은 타임존 없는 한국 시각 글자라 글자에서 읽는다 */
export function popularUpdatedLabel(basedAt: string | null) {
  const match = basedAt
    ? /^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(basedAt)
    : null;
  if (!match) return null;
  const [, month, day, hour, minute] = match;
  return `${Number(month)}월 ${Number(day)}일 ${hour}:${minute} 업데이트`;
}
