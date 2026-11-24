import {
  MutationObserver,
  QueryClient,
  type MutationObserverOptions,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { consentKeys } from "@/lib/consent/keys";
import { consentMutations } from "@/lib/consent/queries";
import { DEVICE_GOAL_COOKIE, clearDeviceGoal } from "@/lib/goal/device";
import { goalKeys } from "@/lib/goal/keys";
import { meKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { savedKeys } from "@/lib/saved/keys";
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

const consents = [
  {
    item: "GOAL_ACCOUNT",
    label: "목표 계정 저장",
    required: false,
    agreed: true,
    changedAt: "2026-11-24T10:00:00",
    termsVersion: null,
    privacyVersion: null,
    documentVersion: "g1",
  },
];

describe("consentMutations.change", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    stubWebLocks();
    queryClient = new QueryClient();
    for (const key of [
      goalKeys.mine(),
      meKeys.summary(),
      onboardingKeys.bootstrap(),
      productKeys.detail("7"),
    ])
      queryClient.setQueryData(key, {});
  });
  afterEach(() => {
    clearDeviceGoal();
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  const isInvalidated = (key: readonly unknown[]) =>
    queryClient.getQueryState(key)?.isInvalidated;

  it("목표 저장을 켜면 기기 목표를 함께 보내고, 내 동의를 바꾼 뒤 계정 목표에 딸린 조회를 다시 부른다", async () => {
    stubDocumentCookie({ [DEVICE_GOAL_COOKIE]: "MUSCLE_GAIN" });
    const mock = mockAdapter(() => success({ items: consents }));
    api.defaults.adapter = mock.adapter;

    await run(consentMutations.change(queryClient), queryClient, {
      item: "GOAL_ACCOUNT",
      agreed: true,
      documentVersion: "g1",
    });

    expect(JSON.parse(mock.requests[0].data as string)).toEqual({
      agreed: true,
      documentVersion: "g1",
      goal: "MUSCLE_GAIN",
    });
    expect(queryClient.getQueryData(consentKeys.mine())).toEqual(consents);
    expect(isInvalidated(goalKeys.mine())).toBe(true);
    expect(isInvalidated(meKeys.summary())).toBe(true);
    expect(isInvalidated(onboardingKeys.bootstrap())).toBe(true);
  });

  it("철회나 다른 항목에는 목표를 보내지 않는다", async () => {
    stubDocumentCookie({ [DEVICE_GOAL_COOKIE]: "MUSCLE_GAIN" });
    const mock = mockAdapter(() => success({ items: consents }));
    api.defaults.adapter = mock.adapter;

    await run(consentMutations.change(queryClient), queryClient, {
      item: "GOAL_ACCOUNT",
      agreed: false,
    });
    await run(consentMutations.change(queryClient), queryClient, {
      item: "MARKETING",
      agreed: true,
    });

    expect(mock.requests.map((r) => JSON.parse(r.data as string))).toEqual([
      { agreed: false },
      { agreed: true },
    ]);
  });

  it("몸 정보 동의를 바꾸면 칼로리 구간을 쓰는 조회(상품·검색·저장)와 bootstrap을 다시 부른다", async () => {
    stubDocumentCookie();
    api.defaults.adapter = mockAdapter(() =>
      success({ items: consents }),
    ).adapter;
    const scoreKeys = [
      productKeys.detail("7"),
      productKeys.alternatives("7", "WEIGHT_LOSS"),
      searchKeys.result("두유", "WEIGHT_LOSS"),
      savedKeys.list("WEIGHT_LOSS"),
    ];
    for (const key of scoreKeys) queryClient.setQueryData(key, {});

    await run(consentMutations.change(queryClient), queryClient, {
      item: "BODY_PROFILE",
      agreed: false,
    });

    expect(isInvalidated(onboardingKeys.bootstrap())).toBe(true);
    for (const key of scoreKeys) expect(isInvalidated(key)).toBe(true);
    expect(isInvalidated(goalKeys.mine())).toBe(false);
  });

  it("광고성 정보 수신은 계정 목표·점수 조회를 다시 부르지 않는다", async () => {
    stubDocumentCookie();
    api.defaults.adapter = mockAdapter(() =>
      success({ items: consents }),
    ).adapter;

    await run(consentMutations.change(queryClient), queryClient, {
      item: "MARKETING",
      agreed: true,
    });

    expect(isInvalidated(onboardingKeys.bootstrap())).toBe(true);
    expect(isInvalidated(goalKeys.mine())).toBe(false);
    expect(isInvalidated(meKeys.summary())).toBe(false);
    expect(isInvalidated(productKeys.detail("7"))).toBe(false);
  });

  it("기기 목표가 없으면 목표 저장을 켜도 목표를 보내지 않는다", async () => {
    stubDocumentCookie();
    const mock = mockAdapter(() => success({ items: consents }));
    api.defaults.adapter = mock.adapter;

    await run(consentMutations.change(queryClient), queryClient, {
      item: "GOAL_ACCOUNT",
      agreed: true,
    });
    expect(JSON.parse(mock.requests[0].data as string)).toEqual({
      agreed: true,
    });
  });
});
