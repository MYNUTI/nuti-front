import { useSyncExternalStore } from "react";

/*
 * 비교함(담은 제품 목록). 3-2·3-4에서 담고 3-5에서 비교한다. 서버에 비교함 API가 없어 브라우저(localStorage)에
 * 계속 저장한다(2026-11-21 결정 — 앱을 다시 열어도 남아 홈 「담아 둔 비교함이 있을 때」로 이어진다).
 * 비교 화면은 id만 쓰고, 이름·사진은 비교함 바를 서버 조회 없이 그리려고 같이 둔다.
 * 담은 시각(addedAt)은 홈 「담아 둔 비교함」(담은 지 24시간 · 「어제 담은 N개」)을 계산하려고 저장소가 넣는다.
 */
export const COMPARE_MAX = 4;

export type CompareItem = { id: string; name: string; image: string | null };
/** 저장되는 모양. addedAt은 담은 시각(ms) */
export type StoredCompareItem = CompareItem & { addedAt: number };

// 저장 모양이 바뀌거나 fixture → API로 id 체계가 바뀌면 버전을 올려 옛 값을 버린다
const STORAGE_KEY = "nuti_compare_v1";
// 같은 탭에서 바꾼 것을 알리는 이벤트. 다른 탭은 storage 이벤트로 듣는다
const CHANGE_EVENT = "nuti:compare-change";
const EMPTY: readonly StoredCompareItem[] = [];

// 저장소를 못 쓰는 브라우저(사이트 데이터 차단·저장 공간 가득 참)는 이 탭 안에서만 기억한다
let memory: readonly StoredCompareItem[] | null = null;
let cachedRaw: string | null = null;
let cachedItems: readonly StoredCompareItem[] = EMPTY;

function isItem(value: unknown): value is StoredCompareItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    (typeof item.image === "string" || item.image === null) &&
    typeof item.addedAt === "number"
  );
}

function parse(raw: string | null): readonly StoredCompareItem[] {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY;
    const items = value.filter(isItem);
    // 손으로 고친 값이 와도 화면이 깨지지 않게 같은 제품은 하나만, 최대 개수까지만 쓴다
    const unique = items.filter(
      (item, i) => items.findIndex((other) => other.id === item.id) === i,
    );
    return unique.slice(0, COMPARE_MAX);
  } catch {
    return EMPTY;
  }
}

/** 지금 비교함. 내용이 같으면 같은 배열을 돌려준다(useSyncExternalStore 요구) */
export function readCompare(): readonly StoredCompareItem[] {
  if (memory) return memory;
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parse(raw);
  }
  return cachedItems;
}

function write(items: readonly StoredCompareItem[]) {
  if (!memory) {
    try {
      if (items.length === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      memory = items;
    }
  } else {
    memory = items;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 담는다. 이미 있으면 그대로, 꽉 찼으면 담지 않고 "full"을 돌려준다(빼고 담기는 부르는 쪽이 정한다) */
export function addToCompare(item: CompareItem): "added" | "exists" | "full" {
  const items = readCompare();
  if (items.some((other) => other.id === item.id)) return "exists";
  if (items.length >= COMPARE_MAX) return "full";
  write([...items, { ...item, addedAt: Date.now() }]);
  return "added";
}

/**
 * 꽉 찼을 때 하나를 빼고 담는다(3-4 비교함이 다 찼을 때 「빼고 담기」). 한 번에 저장해 중간 상태(3개)가 보이지 않는다.
 * 뺄 제품이 없거나 담을 제품이 이미 있으면 바꾸지 않고 false
 */
export function replaceInCompare(removeId: string, item: CompareItem): boolean {
  const items = readCompare();
  if (
    !items.some((other) => other.id === removeId) ||
    items.some((other) => other.id === item.id)
  )
    return false;
  write([
    ...items.filter((other) => other.id !== removeId),
    { ...item, addedAt: Date.now() },
  ]);
  return true;
}

export function removeFromCompare(id: string) {
  const items = readCompare();
  if (!items.some((item) => item.id === id)) return;
  write(items.filter((item) => item.id !== id));
}

/** useSyncExternalStore용. 이 탭에서 바꾼 것과 다른 탭에서 바꾼 것을 모두 듣는다 */
export function subscribeCompare(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** 서버 렌더에서는 저장소를 못 읽어 빈 비교함으로 그린 뒤 브라우저 값으로 바꾼다 */
export function useCompare(): readonly StoredCompareItem[] {
  return useSyncExternalStore(subscribeCompare, readCompare, () => EMPTY);
}
