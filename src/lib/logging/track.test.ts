import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import {
  isLoggingEnabled,
  logEvent,
  logProductCta,
  logProductView,
  logScanEvent,
  logSearch,
  logFilter,
} from "@/lib/logging/track";
import { stubDocumentCookie, stubWebLocks } from "@/test/browser";
import { failure, mockAdapter, success } from "@/test/http";

const originalAdapter = api.defaults.adapter;
const originalEnv = api.defaults.env;
const originalBaseURL = api.defaults.baseURL;

// fire-and-forget이라 요청이 adapter에 닿을 때까지 기다린다
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("isLoggingEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("값이 있으면 그 값을, 비어 있으면 프로덕션 빌드인지를 따른다", () => {
    vi.stubEnv("NEXT_PUBLIC_LOGGING_ENABLED", "true");
    vi.stubEnv("NODE_ENV", "development");
    expect(isLoggingEnabled()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_LOGGING_ENABLED", "false");
    vi.stubEnv("NODE_ENV", "production");
    expect(isLoggingEnabled()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_LOGGING_ENABLED", "");
    expect(isLoggingEnabled()).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    expect(isLoggingEnabled()).toBe(false);
  });
});

describe("로그 전송", () => {
  beforeEach(() => {
    stubDocumentCookie();
    stubWebLocks();
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    api.defaults.env = originalEnv;
    api.defaults.baseURL = originalBaseURL;
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("꺼져 있으면 보내지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOGGING_ENABLED", "false");
    const mock = mockAdapter(() => success());
    api.defaults.adapter = mock.adapter;

    logProductView("7");
    await flush();
    expect(mock.requests).toHaveLength(0);
  });

  it("켜져 있으면 CTA 외 4종을 각 경로로 보낸다", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOGGING_ENABLED", "true");
    const mock = mockAdapter(() => success());
    api.defaults.adapter = mock.adapter;

    logProductView("7");
    logSearch({ keyword: "두유", resultCount: 0 });
    logFilter({ filterType: "sort" });
    logScanEvent({ result: "SCAN_FAIL" });
    await flush();

    expect(mock.requests.map((request) => request.url)).toEqual([
      "/logging/view",
      "/logging/search",
      "/logging/filter",
      "/logging/scan-event",
    ]);
    expect(JSON.parse(mock.requests[0].data as string)).toEqual({
      productId: 7,
    });
  });

  it("CTA는 페이지를 떠나도 전송되게 fetch keepalive로 보낸다", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOGGING_ENABLED", "true");
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({ isSuccess: true }),
    );
    // 요청 단위 adapter("fetch")가 기본 adapter를 덮어, fetch 자체를 바꿔 끼운다. Node의 Request는 상대
    // 경로를 받지 않아 baseURL을 준다
    api.defaults.env = { ...api.defaults.env, fetch };
    api.defaults.baseURL = "http://nuti.test/api";

    logProductCta("7");
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());

    const [input, init] = fetch.mock.calls[0];
    const request = input as Request;
    expect(request.url).toBe("http://nuti.test/api/logging/cta");
    expect(request.keepalive || init?.keepalive).toBe(true);
    expect(await request.json()).toEqual({ productId: 7 });
  });

  it("앱 이벤트는 기기 시각을 붙여 /events로 fetch keepalive로 보낸다", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOGGING_ENABLED", "true");
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({ isSuccess: true, data: { accepted: 1, dropped: 0 } }),
    );
    api.defaults.env = { ...api.defaults.env, fetch };
    api.defaults.baseURL = "http://nuti.test/api";

    logEvent("goal_set", { screen: "1-5", props: { from_screen: "1-5" } });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());

    const [input, init] = fetch.mock.calls[0];
    const request = input as Request;
    expect(request.url).toBe("http://nuti.test/api/events");
    expect(request.keepalive || init?.keepalive).toBe(true);
    const body = await request.json();
    expect(body).toMatchObject({
      events: [
        { name: "goal_set", screen: "1-5", props: { from_screen: "1-5" } },
      ],
    });
    expect(Number.isNaN(Date.parse(body.events[0].occurredAt))).toBe(false);
  });

  it("실패해도 던지지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOGGING_ENABLED", "true");
    api.defaults.adapter = mockAdapter(() =>
      failure(400, "BAD_REQUEST"),
    ).adapter;
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);

    expect(() => logScanEvent({ result: "SCAN_FAIL" })).not.toThrow();
    await flush();
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
