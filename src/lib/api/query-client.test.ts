import { MutationObserver } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, type ApiErrorCode } from "@/lib/api/errors";
import {
  createQueryClient,
  getQueryClient,
  setMutationErrorListener,
} from "@/lib/api/query-client";

function apiError(status: number | null, code: ApiErrorCode) {
  return new ApiError({ status, code, message: `${code} 문구` });
}

async function countQueryCalls(error: unknown) {
  const queryFn = vi.fn(async () => {
    throw error;
  });
  await createQueryClient()
    .fetchQuery({ queryKey: ["test"], queryFn, retryDelay: 0 })
    .catch(() => undefined);
  return queryFn.mock.calls.length;
}

async function runMutation(error: unknown, consentGate?: boolean) {
  const mutationFn = vi.fn(async () => {
    throw error;
  });
  await new MutationObserver(createQueryClient(), {
    mutationFn,
    meta: { consentGate },
  })
    .mutate()
    .catch(() => undefined);
  return mutationFn.mock.calls.length;
}

describe("createQueryClient 재시도", () => {
  it.each([
    ["네트워크 오류", apiError(null, "NETWORK_ERROR")],
    ["타임아웃", apiError(null, "TIMEOUT")],
    ["5xx", apiError(503, "INTERNAL_SERVER_ERROR")],
  ])("%s는 한 번만 다시 보낸다", async (_, error) => {
    await expect(countQueryCalls(error)).resolves.toBe(2);
  });

  it.each([
    ["4xx", apiError(404, "PRODUCT_NOT_FOUND")],
    ["취소", apiError(null, "CANCELED")],
    ["코드 오류", new TypeError("bug")],
  ])("%s는 다시 보내지 않는다", async (_, error) => {
    await expect(countQueryCalls(error)).resolves.toBe(1);
  });

  it("변경은 5xx여도 다시 보내지 않는다", async () => {
    await expect(
      runMutation(apiError(503, "INTERNAL_SERVER_ERROR")),
    ).resolves.toBe(1);
  });
});

describe("setMutationErrorListener", () => {
  let release = () => {};
  afterEach(() => release());

  it("변경 실패를 화면 문구와 함께 알린다", async () => {
    const listener = vi.fn();
    release = setMutationErrorListener(listener);
    const error = apiError(409, "SAVE_LIMIT_EXCEEDED");

    await runMutation(error);
    expect(listener).toHaveBeenCalledWith("SAVE_LIMIT_EXCEEDED 문구", error);
  });

  it.each(["CONSENT_REQUIRED", "HEALTH_CONSENT_REQUIRED"] as const)(
    "게이트로 감싼 변경의 동의 필요(%s)는 알리지 않는다",
    async (code) => {
      const listener = vi.fn();
      release = setMutationErrorListener(listener);

      await runMutation(apiError(403, code), true);
      expect(listener).not.toHaveBeenCalled();
    },
  );

  it("게이트 표시가 없으면 동의 필요도 알린다", async () => {
    const listener = vi.fn();
    release = setMutationErrorListener(listener);

    await runMutation(apiError(403, "CONSENT_REQUIRED"));
    expect(listener).toHaveBeenCalledOnce();
  });

  it("게이트로 감싼 변경도 다른 실패는 알린다", async () => {
    const listener = vi.fn();
    release = setMutationErrorListener(listener);

    await runMutation(apiError(409, "SAVE_LIMIT_EXCEEDED"), true);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("해제하면 더 알리지 않는다", async () => {
    const listener = vi.fn();
    setMutationErrorListener(listener)();

    await runMutation(apiError(500, "INTERNAL_SERVER_ERROR"));
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("getQueryClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("서버 렌더에서는 요청마다 새로 만든다", () => {
    expect(getQueryClient()).not.toBe(getQueryClient());
  });

  it("브라우저에서는 같은 클라이언트를 쓴다", () => {
    vi.stubGlobal("window", {});
    expect(getQueryClient()).toBe(getQueryClient());
  });
});
