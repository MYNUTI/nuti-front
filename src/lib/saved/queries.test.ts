import {
  MutationObserver,
  QueryClient,
  type MutationObserverOptions,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api/client";
import { meKeys } from "@/lib/me/keys";
import { productKeys } from "@/lib/product/keys";
import { savedKeys } from "@/lib/saved/keys";
import { savedMutations, savedQueries } from "@/lib/saved/queries";
import { searchKeys } from "@/lib/search/keys";
import type { SearchResult } from "@/lib/search/types";
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

describe("savedQueries.list", () => {
  it("hasNext면 다음 페이지 번호를, 아니면 undefined를 준다", () => {
    const { getNextPageParam } = savedQueries.list();
    const page = (hasNext: boolean) => ({ items: [], totalCount: 0, hasNext });
    expect(getNextPageParam(page(true), [], 1, [1])).toBe(2);
    expect(getNextPageParam(page(false), [], 3, [1, 2, 3])).toBeUndefined();
  });
});

describe("savedMutations", () => {
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

  it.each([
    ["save", true, { saved: true, savedCount: 1 }],
    ["remove", false, { saved: false }],
  ] as const)(
    "%s는 상세·검색 캐시의 saved만 바꾸고 다시 부르지 않는다",
    async (name, saved, response) => {
      api.defaults.adapter = mockAdapter(() => success(response)).adapter;
      queryClient.setQueryData(productKeys.detail("7"), {
        status: "INSUFFICIENT",
        saved: !saved,
      });
      queryClient.setQueryData(savedKeys.list(), { pages: [], pageParams: [] });
      queryClient.setQueryData(meKeys.summary(), {});
      const searchPage: SearchResult = {
        query: "두유",
        appliedGoal: "GENERAL",
        exactMatches: {
          total: 1,
          items: [
            {
              id: "7",
              name: "두유",
              brandName: null,
              imageUrl: null,
              saved: !saved,
              status: "INSUFFICIENT",
            },
          ],
        },
        similarProducts: { total: 0, items: [] },
        didYouMean: null,
        sameCategoryTop: [],
        canRequestAnalysis: false,
      };
      queryClient.setQueryData(searchKeys.result("두유"), {
        pages: [searchPage],
        pageParams: [0],
      });

      await run(savedMutations[name](queryClient), queryClient, "7");

      expect(queryClient.getQueryData(productKeys.detail("7"))).toEqual({
        status: "INSUFFICIENT",
        saved,
      });
      expect(
        queryClient.getQueryState(productKeys.detail("7"))?.isInvalidated,
      ).toBe(false);
      expect(queryClient.getQueryState(savedKeys.list())?.isInvalidated).toBe(
        true,
      );
      expect(queryClient.getQueryState(meKeys.summary())?.isInvalidated).toBe(
        true,
      );
      const search = queryClient.getQueryData<{ pages: SearchResult[] }>(
        searchKeys.result("두유"),
      )!;
      expect(search.pages[0].exactMatches.items[0].saved).toBe(saved);
    },
  );

  it("상세 캐시가 없으면 만들지 않는다", async () => {
    api.defaults.adapter = mockAdapter(() =>
      success({ saved: true, savedCount: 1 }),
    ).adapter;
    await run(savedMutations.save(queryClient), queryClient, "7");
    expect(queryClient.getQueryData(productKeys.detail("7"))).toBeUndefined();
  });
});
