/*
 * 2-3 검색(입력 중) 자동완성의 초성 맞추기(【최종】 메모: 「ㄷㄷㅂ」으로도 자동완성).
 * 2-4 검색 결과 fixture도 이 맞추기로 거른다. API 연결 뒤에는 서버가 일치 구간 · 결과를 주므로 fixture에서만 쓴다.
 */
const CHOSUNG = [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"];
const SYLLABLE_START = 0xac00;
const SYLLABLE_END = 0xd7a3;

/** 글자마다 초성으로 바꾼다. 한글 음절이 아닌 글자는 그대로 둔다(길이가 원래 글자와 같다) */
export function toChosung(text: string): string {
  return [...text]
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < SYLLABLE_START || code > SYLLABLE_END) return char;
      return CHOSUNG[Math.floor((code - SYLLABLE_START) / 588)];
    })
    .join("");
}

/** 초성(ㄱ~ㅎ)만으로 된 말인지 */
export function isChosungOnly(text: string): boolean {
  return text.length > 0 && [...text].every((char) => CHOSUNG.includes(char));
}

/**
 * name에서 query가 나오는 [시작, 끝) 구간. 그대로 포함되면 그 자리, 초성만 넣었으면 초성이 같은 자리
 * (초성 검색은 빈칸을 가리지 않는다: 「ㄷㄷㅂㄹ」 · 「ㄷㄷㅂ ㄹ」 모두 「더단백 라떼」). 없으면 null.
 * 영문은 대소문자를 가리지 않고, 자모가 나뉘어 들어온 글자(NFD)는 합쳐서 본다
 */
export function matchRange(
  name: string,
  query: string,
): [number, number] | null {
  const text = name.normalize("NFC");
  const q = query.normalize("NFC").trim().toLowerCase();
  if (!q) return null;
  const direct = text.toLowerCase().indexOf(q);
  if (direct >= 0) return [direct, direct + q.length];
  const compact = q.replace(/\s+/g, "");
  if (!isChosungOnly(compact)) return null;
  // 빈칸을 뺀 초성 줄에서 찾고, 찾은 자리를 원래 글자 자리로 되돌린다
  const kept = [...text].flatMap((char, i) => (/\s/.test(char) ? [] : [i]));
  const chosung = toChosung(kept.map((i) => text[i]).join(""));
  const at = chosung.indexOf(compact);
  if (at < 0) return null;
  return [kept[at], kept[at + compact.length - 1] + 1];
}

/**
 * 말 뒤에 붙일 「로/으로」. 받침이 없거나 ㄹ 받침이면 「로」, 다른 받침이면 「으로」.
 * 한글 음절로 끝나지 않으면(영문 · 숫자) 읽는 법을 몰라 「(으)로」
 */
export function particleRo(word: string): string {
  const last = word.normalize("NFC").trim().slice(-1);
  const code = last.charCodeAt(0);
  if (!last || code < SYLLABLE_START || code > SYLLABLE_END) return "(으)로";
  const jong = (code - SYLLABLE_START) % 28;
  return jong === 0 || jong === 8 ? "로" : "으로";
}
