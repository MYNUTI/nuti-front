import {
  MutationObserver,
  QueryClient,
  type MutationObserverOptions,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { goalKeys } from "@/lib/goal/keys";
import { meKeys } from "@/lib/me/keys";
import { meMutations } from "@/lib/me/queries";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { searchKeys } from "@/lib/search/keys";
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

const goalDependent = [
  goalKeys.mine(),
  meKeys.summary(),
  productKeys.detail("7"),
  searchKeys.result("두유"),
];

describe("meMutations.updateSettings", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    stubDocumentCookie();
    stubWebLocks();
    queryClient = new QueryClient();
    api.defaults.adapter = mockAdapter(() =>
      success({
        clipboardLinkDetection: false,
        goal: { code: "MUSCLE_GAIN", label: "근육 증가" },
        policies: {},
        appVersion: "2.0.0-web",
      }),
    ).adapter;
    for (const key of [...goalDependent, onboardingKeys.bootstrap()])
      queryClient.setQueryData(key, {});
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  const isInvalidated = (key: readonly unknown[]) =>
    queryClient.getQueryState(key)?.isInvalidated;

  it("응답으로 설정 캐시를 바꾸고, 목표를 바꾸면 목표 기준 조회를 다시 부른다", async () => {
    await run(meMutations.updateSettings(queryClient), queryClient, {
      goal: "MUSCLE_GAIN",
    });

    expect(queryClient.getQueryData(meKeys.settings())).toMatchObject({
      goal: { goal: "MUSCLE_GAIN", label: "근육 증가" },
    });
    expect(isInvalidated(onboardingKeys.bootstrap())).toBe(true);
    for (const key of goalDependent) expect(isInvalidated(key)).toBe(true);
  });

  it("링크 감지만 바꾸면 bootstrap만 다시 부른다", async () => {
    await run(meMutations.updateSettings(queryClient), queryClient, {
      clipboardLinkDetection: false,
    });

    expect(isInvalidated(onboardingKeys.bootstrap())).toBe(true);
    for (const key of goalDependent) expect(isInvalidated(key)).toBe(false);
  });
});
