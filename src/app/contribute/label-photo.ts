/*
 * 3-7에서 찍거나 고른 영양성분표 사진을 3-8 읽은 값 확인으로 넘기는 자리. 사진은 주소에 실을 수 없고
 * 화면을 옮겨도(클라이언트 이동) 문서가 그대로라 메모리에 둔다. 새로 고치면 사라지고, 그때 3-8은 3-7로 돌려보낸다.
 * 메모: 사진은 운영자 확인이 끝나면 지운다 — 기기에도 오래 남기지 않는다(브라우저 저장소에 쓰지 않음).
 */
import { addRequestedHere } from "@/components/scan/requested-gtins";
import type { Gtin } from "@/lib/scan/types";

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

/** 「이 사진 그대로 보내기」(3-7x · 3-8) 뒤 갈 곳: 4-3 내 기록(분석 요청, 방금 보냈을 때). 알림은 09단계 */
export const SENT_PHOTO_HREF = "/history?tab=requests&sent=photo";

/**
 * 「이 사진 그대로 보내기」. 사진을 보내는 API가 없어(남은 질문 44) 보내지 않는다. 바코드로 왔으면 3-6 시트가
 * 「이미 요청하셨어요」를 보이게 남기고, 메모(3-7)대로 사진을 지운다
 */
export function sendLabelPhoto(gtin: Gtin | null) {
  if (gtin) addRequestedHere(gtin);
  clearLabelPhoto();
}
