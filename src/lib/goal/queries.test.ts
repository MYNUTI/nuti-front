import {
  MutationObserver,
  QueryClient,
  type MutationObserverOptions,
} from "@tanstack/react-query";
import type { InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { IDENTITY_COOKIES } from "@/lib/api/identity";
import { DEVICE_GOAL_COOKIE } from "@/lib/goal/device-cookie";
import { goalKeys } from "@/lib/goal/keys";
import { applyAccountGoal, goalMutations } from "@/lib/goal/queries";
import { meKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { stubDocumentCookie, stubWebLocks } from "@/test/browser";
import {
  failure,
  jwtExpiringIn,
  mockAdapter,
  success,
  type Reply,
} from "@/test/http";

const originalAdapter = api.defaults.adapter;

function run<TData, TVariables>(
  options: MutationObserverOptions<TData, Error, TVariables>,
  queryClient: QueryClient,
  variables: TVariables,
) {
  return new MutationObserver(queryClient, options).mutate(variables);
}

const loggedIn = {
  [IDENTITY_COOKIES.accessToken]: jwtExpiringIn(600_000),
  [IDENTITY_COOKIES.refreshToken]: "refresh-1",
};

function myGoal(goalAccountConsented: boolean, appliedAt?: string) {
  return {
    goal: "MUSCLE_GAIN",
    label: "근육 증가",
    goalAccountConsented,
    ...(appliedAt && { appliedAt }),
  };
}

function reply(handler: (config: InternalAxiosRequestConfig) => Reply) {
  const mock = mockAdapter(handler);
  api.defaults.adapter = mock.adapter;
  return mock;
}

describe("goalMutations.change", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    stubWebLocks();
    queryClient = new QueryClient();
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  it("로그인하지 않았으면 기기에만 저장하고 서버에 보내지 않는다", async () => {
    const cookies = stubDocumentCookie();
    const { requests } = reply(() => success());

    await expect(
      run(goalMutations.change(queryClient), queryClient, "MUSCLE_GAIN"),
    ).resolves.toBe(false);
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBe("MUSCLE_GAIN");
    expect(requests).toHaveLength(0);
  });

  it("로그인했지만 목표 계정 저장에 동의하지 않았으면 계정에 보내지 않는다", async () => {
    const cookies = stubDocumentCookie(loggedIn);
    const { requests } = reply(() => success(myGoal(false)));

    await expect(
      run(goalMutations.change(queryClient), queryClient, "MUSCLE_GAIN"),
    ).resolves.toBe(false);
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBe("MUSCLE_GAIN");
    expect(requests.map((r) => r.method)).toEqual(["get"]);
  });

  it("동의한 로그인 계정이면 계정에도 저장하고 계정 목표를 보여 주는 조회만 다시 부른다", async () => {
    stubDocumentCookie(loggedIn);
    const { requests } = reply((config) =>
      config.method === "get"
        ? success(myGoal(true, "2026-11-20T10:00:00"))
        : success({
            goal: "MUSCLE_GAIN",
            label: "근육 증가",
            appliedAt: "2026-11-23T10:00:00",
            recalculation: null,
          }),
    );
    for (const key of [
      meKeys.summary(),
      onboardingKeys.bootstrap(),
      productKeys.detail("7"),
    ])
      queryClient.setQueryData(key, {});

    await expect(
      run(goalMutations.change(queryClient), queryClient, "MUSCLE_GAIN"),
    ).resolves.toBe(true);
    expect(requests[1]).toMatchObject({ method: "put", url: "/me/goal" });
    expect(JSON.parse(requests[1].data as string)).toEqual({
      goal: "MUSCLE_GAIN",
    });
    const isInvalidated = (key: readonly unknown[]) =>
      queryClient.getQueryState(key)?.isInvalidated;
    expect(isInvalidated(meKeys.summary())).toBe(true);
    expect(isInvalidated(onboardingKeys.bootstrap())).toBe(true);
    // 결과는 두 목표 점수를 함께 줘 다시 부르면 조회수만 오른다
    expect(isInvalidated(productKeys.detail("7"))).toBe(false);
  });

  it("계정 목표 조회가 실패해도 실패로 끝내지 않고 기기 목표는 바뀐 채 둔다", async () => {
    const cookies = stubDocumentCookie(loggedIn);
    const { requests } = reply(() => failure(503, "INTERNAL_SERVER_ERROR"));

    await expect(
      run(goalMutations.change(queryClient), queryClient, "MUSCLE_GAIN"),
    ).resolves.toBe(false);
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBe("MUSCLE_GAIN");
    expect(requests.every((r) => r.method === "get")).toBe(true);
  });

  it("계정 저장이 실패해도 실패로 끝내지 않고 기기 목표는 바뀐 채 둔다", async () => {
    const cookies = stubDocumentCookie(loggedIn);
    reply((config) =>
      config.method === "get"
        ? success(myGoal(true))
        : failure(503, "INTERNAL_SERVER_ERROR"),
    );

    await expect(
      run(goalMutations.change(queryClient), queryClient, "MUSCLE_GAIN"),
    ).resolves.toBe(false);
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBe("MUSCLE_GAIN");
  });
});

describe("applyAccountGoal", () => {
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  it("동의하고 계정에 저장한 목표가 있으면 기기 목표를 맞춘다", async () => {
    const cookies = stubDocumentCookie({
      ...loggedIn,
      [DEVICE_GOAL_COOKIE]: "WEIGHT_LOSS",
    });
    stubWebLocks();
    reply(() => success(myGoal(true, "2026-11-20T10:00:00")));

    await applyAccountGoal(new QueryClient());
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBe("MUSCLE_GAIN");
  });

  it.each([
    ["동의하지 않았으면", myGoal(false, "2026-11-20T10:00:00")],
    ["계정에 저장한 목표가 없으면", myGoal(true)],
  ])("%s 기기 목표를 그대로 둔다", async (_, dto) => {
    const cookies = stubDocumentCookie({
      ...loggedIn,
      [DEVICE_GOAL_COOKIE]: "WEIGHT_LOSS",
    });
    stubWebLocks();
    reply(() => success(dto));

    await applyAccountGoal(new QueryClient());
    expect(cookies.get(DEVICE_GOAL_COOKIE)).toBe("WEIGHT_LOSS");
  });
});

describe("goalKeys", () => {
  it("목표 조회 키는 목표 키로 시작한다", () => {
    expect(goalKeys.mine()[0]).toBe(goalKeys.all[0]);
  });
});
