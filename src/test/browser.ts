import { vi } from "vitest";

/**
 * 테스트 환경(node)에 없는 `document.cookie`와 `location.protocol`을 흉내 낸다. 쓰기는 `이름=값` 뒤의
 * 속성 중 `Max-Age=0`(삭제)만 해석한다. 쓴 원문은 `writes`에 쌓인다.
 */
export function stubDocumentCookie(
  initial: Record<string, string> = {},
  { protocol = "http:" }: { protocol?: "http:" | "https:" } = {},
) {
  const jar = new Map(Object.entries(initial));
  const writes: string[] = [];
  vi.stubGlobal("location", { protocol });
  vi.stubGlobal("document", {
    get cookie() {
      return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
    },
    set cookie(raw: string) {
      writes.push(raw);
      const [pair, ...attributes] = raw.split(";").map((part) => part.trim());
      const separator = pair.indexOf("=");
      const name = pair.slice(0, separator);
      if (attributes.some((attribute) => attribute === "Max-Age=0"))
        jar.delete(name);
      else jar.set(name, pair.slice(separator + 1));
    },
  });
  return {
    get: (name: string) => {
      const value = jar.get(name);
      return value === undefined ? undefined : decodeURIComponent(value);
    },
    writes,
  };
}

/** 한 번에 하나씩 콜백을 돌리는 `navigator.locks`. 받은 락 이름은 `requests`에 쌓인다 */
export function stubWebLocks() {
  const requests: string[] = [];
  let tail: Promise<unknown> = Promise.resolve();
  vi.stubGlobal("navigator", {
    locks: {
      request: (name: string, callback: () => Promise<unknown>) => {
        requests.push(name);
        const run = tail.then(callback);
        tail = run.catch(() => undefined);
        return run;
      },
    },
  });
  return { requests };
}

/** 테스트 환경(node)에 없는 `localStorage`를 흉내 낸다 */
export function stubLocalStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
  });
  return store;
}

const channels = new Map<string, Set<FakeBroadcastChannel>>();
const posted: { name: string; data: unknown }[] = [];

// 실제처럼 같은 이름의 다른 객체에만 전달하고 보낸 객체에는 돌려주지 않는다. 모듈에 남아 있는 채널도
// 받게 테스트 사이에 목록을 비우지 않는다
class FakeBroadcastChannel extends EventTarget {
  constructor(readonly name: string) {
    super();
    if (!channels.has(name)) channels.set(name, new Set());
    channels.get(name)!.add(this);
  }
  postMessage(data: unknown) {
    posted.push({ name: this.name, data });
    for (const other of channels.get(this.name) ?? [])
      if (other !== this)
        other.dispatchEvent(new MessageEvent("message", { data }));
  }
  close() {
    channels.get(this.name)?.delete(this);
  }
}

/** 테스트 환경(node)의 실제 `BroadcastChannel`은 프로세스를 붙잡아 흉내 낸 것으로 바꾼다 */
export function stubBroadcastChannel() {
  posted.length = 0;
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
  return {
    /** 이 탭이 보낸 메시지 */
    posted,
    /** 다른 탭이 보낸 것처럼 전달한다 */
    fromOtherTab(name: string, data: unknown) {
      const other = new FakeBroadcastChannel(name);
      other.postMessage(data);
      other.close();
      posted.pop();
    },
  };
}
