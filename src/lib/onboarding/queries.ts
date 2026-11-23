import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { fetchBootstrap } from "@/lib/onboarding/api";
import { onboardingKeys } from "@/lib/onboarding/keys";

export const onboardingQueries = {
  bootstrap: () =>
    queryOptions({
      queryKey: onboardingKeys.bootstrap(),
      queryFn: ({ signal }) => fetchBootstrap(api, signal),
    }),
};

export function useBootstrap() {
  return useQuery(onboardingQueries.bootstrap());
}
