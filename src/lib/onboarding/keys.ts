export const onboardingKeys = {
  all: ["onboarding"] as const,
  bootstrap: () => [...onboardingKeys.all, "bootstrap"] as const,
};
