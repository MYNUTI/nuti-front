import {
  MutationObserver,
  QueryClient,
  type MutationObserverOptions,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { goalKeys } from "@/lib/goal/keys";
import { goalMutations } from "@/lib/goal/queries";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { stubDocumentCookie, stubWebLocks } from "@/test/browser";
import { mockAdapter, success } from "@/test/http";

const originalAdapter = api.defaults.adapter;

function run<TData, TVariables>(
  options: MutationObserverOptions<TData, Error, TVariables>,
  queryClient: QueryClient,
  variables: TVariables,
) {
  return new MutationObserver(queryClient, options).mutate(variables);
}

const isInvalidated = (queryClient: QueryClient, key: readonly unknown[]) =>
  queryClient.getQueryState(key)?.isInvalidated;

describe("goalMutations.update", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    stubDocumentCookie();
    stubWebLocks();
    queryClient = new QueryClient();
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  it("재계산 상품 ID를 숫자로 보내고, 목표·상품·bootstrap을 다시 부른다", async () => {
    const mock = mockAdapter(() =>
      success({
        goal: "MUSCLE_GAIN",
        label: "근육 증가",
        appliedAt: "2026-11-03T10:00:00",
        recalculation: null,
      }),
    );
    api.defaults.adapter = mock.adapter;
    for (const key of [
      goalKeys.mine(),
      productKeys.detail("7"),
      onboardingKeys.bootstrap(),
    ])
      queryClient.setQueryData(key, {});

    await run(goalMutations.update(queryClient), queryClient, {
      goal: "MUSCLE_GAIN",
      recalcProductId: "7",
    });

    expect(mock.requests[0]).toMatchObject({ method: "put", url: "/me/goal" });
    expect(JSON.parse(mock.requests[0].data as string)).toEqual({
      goal: "MUSCLE_GAIN",
      recalcProductId: 7,
    });
    expect(isInvalidated(queryClient, goalKeys.mine())).toBe(true);
    expect(isInvalidated(queryClient, productKeys.detail("7"))).toBe(true);
    expect(isInvalidated(queryClient, onboardingKeys.bootstrap())).toBe(true);
  });

  it("재계산 상품이 없으면 키를 보내지 않는다", async () => {
    const mock = mockAdapter(() =>
      success({
        goal: "GENERAL",
        label: "일반",
        appliedAt: "2026-11-03T10:00:00",
        recalculation: null,
      }),
    );
    api.defaults.adapter = mock.adapter;

    await run(goalMutations.update(queryClient), queryClient, {
      goal: "GENERAL",
    });
    expect(JSON.parse(mock.requests[0].data as string)).toEqual({
      goal: "GENERAL",
    });
  });
});
