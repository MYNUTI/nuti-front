"use client";

import { useSyncExternalStore } from "react";

/*
 * 2-3 최근 검색어. 서버 API(`/search/keywords/recent`)는 보류 · 폐지라 브라우저에 둔다(API 플랜).
 * 최근에 찾은 말이 앞이고 같은 말은 하나만 남긴다. 다른 탭에서 바꾸면 storage 이벤트로 따라간다.
 */
const KEY = "nuti_recent_search_v1";
const CHANGE_EVENT = "nuti:recent-search-change";
export const RECENT_MAX = 10;

const EMPTY: readonly string[] = [];
// 같은 값이면 같은 배열을 돌려줘야 useSyncExternalStore가 다시 그리지 않는다
let cache: { raw: string | null; words: readonly string[] } = {
  raw: null,
  words: EMPTY,
};
// 저장이 막힌 브라우저(사생활 보호 모드 등)는 이번에 연 동안만 기억한다
let memory: readonly string[] = EMPTY;
let storageBlocked = false;

// 손으로 고쳤거나 옛 값이 들어 있어도 화면이 깨지지 않게 문자열만, 빈 말 없이, 한 번씩, 최대 개수까지 읽는다
function parse(raw: string | null): readonly string[] {
  if (!raw) return EMPTY;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!Array.isArray(value)) return EMPTY;
  const words = value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v, i, all) => v !== "" && all.indexOf(v) === i);
  return words.length === 0 ? EMPTY : words.slice(0, RECENT_MAX);
}

export function readRecent(): readonly string[] {
  if (storageBlocked) return memory;
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    storageBlocked = true;
    return memory;
  }
  if (raw !== cache.raw) cache = { raw, words: parse(raw) };
  return cache.words;
}

function write(words: readonly string[]) {
  memory = words;
  try {
    if (words.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(words));
  } catch {
    storageBlocked = true;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 찾은 말을 맨 앞에 둔다. 앞뒤 빈칸을 떼고, 빈 말은 남기지 않는다 */
export function addRecent(word: string) {
  const w = word.trim();
  if (!w) return;
  const rest = readRecent().filter((other) => other !== w);
  write([w, ...rest].slice(0, RECENT_MAX));
}

export function removeRecent(word: string) {
  const words = readRecent();
  if (!words.includes(word)) return;
  write(words.filter((other) => other !== word));
}

export function clearRecent() {
  if (readRecent().length === 0) return;
  write(EMPTY);
}

export function subscribeRecent(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useRecentSearches(): readonly string[] {
  return useSyncExternalStore(subscribeRecent, readRecent, () => EMPTY);
}
