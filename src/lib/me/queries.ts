import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  fetchMeSettings,
  fetchMeSummary,
  fetchPolicies,
  fetchUser,
} from "@/lib/me/api";
import { meKeys, metaKeys } from "@/lib/me/keys";

export const meQueries = {
  summary: () =>
    queryOptions({
      queryKey: meKeys.summary(),
      queryFn: ({ signal }) => fetchMeSummary(api, signal),
    }),
  /** 토큰이 없으면 401이다. `bootstrap.isLoggedIn`일 때만 부른다 */
  user: () =>
    queryOptions({
      queryKey: meKeys.user(),
      queryFn: ({ signal }) => fetchUser(api, signal),
    }),
  settings: () =>
    queryOptions({
      queryKey: meKeys.settings(),
      queryFn: ({ signal }) => fetchMeSettings(api, signal),
    }),
  policies: () =>
    queryOptions({
      queryKey: metaKeys.policies(),
      queryFn: ({ signal }) => fetchPolicies(api, signal),
    }),
};

export function useMeSummary() {
  return useQuery(meQueries.summary());
}

export function useUser({ enabled = true } = {}) {
  return useQuery({ ...meQueries.user(), enabled });
}

export function useMeSettings() {
  return useQuery(meQueries.settings());
}

export function usePolicies() {
  return useQuery(meQueries.policies());
}
