import {
  MutationObserver,
  QueryClient,
  type MutationObserverOptions,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { IDENTITY_COOKIES } from "@/lib/api/identity";
import { goalKeys } from "@/lib/goal/keys";
import { meKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import {
  onboardingMutations,
  onboardingQueries,
} from "@/lib/onboarding/queries";
import { rememberOnboardingCompleted } from "@/lib/onboarding/storage";
import type { Bootstrap } from "@/lib/onboarding/types";
import { productKeys } from "@/lib/product/keys";
import { savedKeys } from "@/lib/saved/keys";
import { searchKeys } from "@/lib/search/keys";
import {
  stubDocumentCookie,
  stubLocalStorage,
  stubWebLocks,
} from "@/test/browser";
import { failure, mockAdapter, success, type Reply } from "@/test/http";

const originalAdapter = api.defaults.adapter;

function reply(handler: () => Reply) {
  const mock = mockAdapter(handler);
  api.defaults.adapter = mock.adapter;
  return mock;
}

function run<TData, TVariables>(
  options: MutationObserverOptions<TData, Error, TVariables>,
  queryClient: QueryClient,
  variables: TVariables,
) {
  return new MutationObserver(queryClient, options).mutate(variables);
}

const bootstrap: Bootstrap = {
  isLoggedIn: false,
  consentAgreed: false,
  healthConsented: false,
  onboardingCompleted: false,
  goal: "GENERAL",
  clipboardLinkDetection: true,
  currentPolicyVersion: "v1",
};

describe("onboarding queries", () => {
  let cookies: ReturnType<typeof stubDocumentCookie>;
  let storage: Map<string, string>;
  let queryClient: QueryClient;

  beforeEach(() => {
    cookies = stubDocumentCookie();
    storage = stubLocalStorage();
    stubWebLocks();
    queryClient = new QueryClient();
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  it("bootstrap은 이 기기에 기억한 온보딩 완료를 함께 본다", () => {
    const select = onboardingQueries.bootstrap().select!;
    expect(select(bootstrap).onboardingCompleted).toBe(false);
    storage.set("nuti_onboarding_completed", "1");
    expect(select(bootstrap).onboardingCompleted).toBe(true);
  });

  it("개인정보 동의는 필수 항목을 보내고 받은 익명 ID를 저장한 뒤 bootstrap을 다시 부른다", async () => {
    const { requests } = reply(() =>
      success({ anonymousId: "anon-1", agreedAt: "2026-11-03T10:00:00" }),
    );
    queryClient.setQueryData(onboardingKeys.bootstrap(), bootstrap);

    await run(onboardingMutations.agreePrivacy(queryClient), queryClient, "v1");

    expect(JSON.parse(requests[0].data as string)).toEqual({
      policyVersion: "v1",
      agreedItems: ["PERSONAL_INFO", "AGE_OVER_14"],
    });
    expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBe("anon-1");
    expect(
      queryClient.getQueryState(onboardingKeys.bootstrap())?.isInvalidated,
    ).toBe(true);
  });

  it.each([
    [409, "POLICY_VERSION_CONFLICT", true],
    [400, "VALIDATION_FAILED", false],
  ] as const)(
    "개인정보 동의가 %s %s로 실패하면 bootstrap 무효화 여부는 %s다",
    async (status, code, invalidated) => {
      reply(() => failure(status, code));
      queryClient.setQueryData(onboardingKeys.bootstrap(), bootstrap);

      await run(
        onboardingMutations.agreePrivacy(queryClient),
        queryClient,
        "v1",
      ).catch(() => undefined);

      expect(
        queryClient.getQueryState(onboardingKeys.bootstrap())?.isInvalidated,
      ).toBe(invalidated);
    },
  );

  it("응답의 익명 ID가 null이면 저장하지 않는다", async () => {
    reply(() =>
      success({ anonymousId: null, agreedAt: "2026-11-03T10:00:00" }),
    );
    await run(onboardingMutations.agreePrivacy(queryClient), queryClient, "v1");
    expect(cookies.get(IDENTITY_COOKIES.anonymousId)).toBeUndefined();
  });

  it("건강정보 동의는 동의 상태를 바꾸고 bootstrap·목표를 다시 부른다", async () => {
    reply(() =>
      success({ healthConsented: true, agreedAt: "2026-11-03T10:00:00" }),
    );
    queryClient.setQueryData(onboardingKeys.bootstrap(), bootstrap);
    queryClient.setQueryData(goalKeys.mine(), {});

    await run(onboardingMutations.agreeHealth(queryClient), queryClient, {
      policyVersion: "h1",
    });

    expect(queryClient.getQueryData(onboardingKeys.healthConsent())).toEqual({
      healthConsented: true,
      agreedAt: "2026-11-03T10:00:00",
    });
    expect(
      queryClient.getQueryState(onboardingKeys.bootstrap())?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(goalKeys.mine())?.isInvalidated).toBe(
      true,
    );
  });

  it("건강정보 철회는 동의 상태를 바꾸고 목표에 딸린 조회(저장 목록 포함)를 다시 부른다", async () => {
    reply(() => success({ healthConsented: false }));
    queryClient.setQueryData(productKeys.detail("7"), {});
    queryClient.setQueryData(goalKeys.mine(), {});
    queryClient.setQueryData(searchKeys.result("두유"), {});
    queryClient.setQueryData(meKeys.summary(), {});
    queryClient.setQueryData(meKeys.settings(), {});
    queryClient.setQueryData(savedKeys.list(), {});

    await run(
      onboardingMutations.revokeHealth(queryClient),
      queryClient,
      undefined,
    );

    expect(queryClient.getQueryData(onboardingKeys.healthConsent())).toEqual({
      healthConsented: false,
      agreedAt: null,
    });
    expect(
      queryClient.getQueryState(productKeys.detail("7"))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(searchKeys.result("두유"))?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(meKeys.summary())?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(meKeys.settings())?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(savedKeys.list())?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(goalKeys.mine())?.isInvalidated).toBe(
      true,
    );
  });

  it.each([
    [false, "1"],
    [true, undefined],
  ])(
    "온보딩 완료가 서버에 저장되지 않았으면(persisted=%s) 이 기기에 기억한다",
    async (persisted, expected) => {
      reply(() =>
        success({
          onboardingCompleted: true,
          completedAt: "2026-11-03T10:00:00",
          persisted,
        }),
      );
      await run(
        onboardingMutations.complete(queryClient),
        queryClient,
        undefined,
      );
      expect(storage.get("nuti_onboarding_completed")).toBe(expected);
    },
  );
});

describe("저장소를 막은 브라우저", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("localStorage 접근이 던져도 bootstrap select와 완료 기억은 실패하지 않는다", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    });
    const select = onboardingQueries.bootstrap().select!;
    expect(select(bootstrap).onboardingCompleted).toBe(false);
    expect(() => rememberOnboardingCompleted()).not.toThrow();
  });
});
