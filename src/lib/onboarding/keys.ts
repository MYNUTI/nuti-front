export const onboardingKeys = {
  all: ["onboarding"] as const,
  bootstrap: () => [...onboardingKeys.all, "bootstrap"] as const,
  healthConsent: () => [...onboardingKeys.all, "health-consent"] as const,
  samples: (size?: number) =>
    [...onboardingKeys.all, "samples", size ?? null] as const,
};
