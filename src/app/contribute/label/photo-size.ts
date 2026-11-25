/** 3-7 메모: 기기에서 긴 변 2,400px로 줄여 보낸다 */
export const LONG_EDGE_MAX = 2_400;
/** 3-7 메모: 줄인 뒤에도 10MB를 넘으면 막는다 */
export const PHOTO_BYTES_MAX = 10 * 1024 * 1024;
/** 3-6 · 3-7 메모: JPG · PNG만. 브라우저가 못 여는 HEIC 등은 형식 오류 */
export const PHOTO_TYPES = ["image/jpeg", "image/png"] as const;

/** 긴 변이 max를 넘으면 비율을 지켜 줄인 크기. 넘지 않으면 그대로(키우지 않는다) */
export function fitLongEdge(
  width: number,
  height: number,
  max = LONG_EDGE_MAX,
): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= max) return { width, height };
  const scale = max / long;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
