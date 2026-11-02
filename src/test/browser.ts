import { vi } from "vitest";

/**
 * 테스트 환경(node)에 없는 `document.cookie`를 흉내 낸다. 쓰기는 `이름=값` 뒤의 속성 중 `Max-Age=0`
 * (삭제)만 해석한다. 쓴 원문은 `writes`에 쌓인다.
 */
export function stubDocumentCookie(initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial));
  const writes: string[] = [];
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
