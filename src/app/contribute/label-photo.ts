/*
 * 3-7에서 찍거나 고른 영양성분표 사진을 3-8 읽은 값 확인으로 넘기는 자리. 사진은 주소에 실을 수 없고
 * 화면을 옮겨도(클라이언트 이동) 문서가 그대로라 메모리에 둔다. 새로 고치면 사라지고, 그때 3-8은 3-7로 돌려보낸다.
 * 메모: 사진은 운영자 확인이 끝나면 지운다 — 기기에도 오래 남기지 않는다(브라우저 저장소에 쓰지 않음).
 */
export type LabelPhoto = { blob: Blob; url: string };

let current: LabelPhoto | null = null;

export function setLabelPhoto(blob: Blob) {
  clearLabelPhoto();
  current = { blob, url: URL.createObjectURL(blob) };
  return current;
}

export function getLabelPhoto(): LabelPhoto | null {
  return current;
}

export function clearLabelPhoto() {
  if (current) URL.revokeObjectURL(current.url);
  current = null;
}
