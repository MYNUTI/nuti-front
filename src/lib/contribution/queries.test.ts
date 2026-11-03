import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { contributionMutations } from "@/lib/contribution/queries";
import { meKeys } from "@/lib/me/keys";
import { stubDocumentCookie, stubWebLocks } from "@/test/browser";
import { mockAdapter, success } from "@/test/http";

const originalAdapter = api.defaults.adapter;

describe("contributionMutations.requestAnalysis", () => {
  beforeEach(() => {
    stubDocumentCookie();
    stubWebLocks();
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
  });

  it("접수 뒤 마이를 다시 부른다", async () => {
    api.defaults.adapter = mockAdapter(() =>
      success({
        requestId: 3,
        type: "NEW_PRODUCT",
        requestCount: 1,
        status: "WAITING",
      }),
    ).adapter;
    const queryClient = new QueryClient();
    queryClient.setQueryData(meKeys.summary(), {});

    await new MutationObserver(
      queryClient,
      contributionMutations.requestAnalysis(queryClient),
    ).mutate({ type: "NEW_PRODUCT", keyword: "두유" });

    expect(queryClient.getQueryState(meKeys.summary())?.isInvalidated).toBe(
      true,
    );
  });
});
