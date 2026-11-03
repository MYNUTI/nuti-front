import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { invalidateGoalDependents } from "@/lib/goal/invalidate";
import { goalKeys } from "@/lib/goal/keys";
import { meKeys, metaKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { savedKeys } from "@/lib/saved/keys";
import { searchKeys } from "@/lib/search/keys";

describe("invalidateGoalDependents", () => {
  it("목표 기준 등급과 목표를 보여 주는 조회만 다시 부른다", async () => {
    const queryClient = new QueryClient();
    const dependents = [
      goalKeys.mine(),
      meKeys.summary(),
      meKeys.settings(),
      onboardingKeys.bootstrap(),
      productKeys.detail("7"),
      productKeys.barcode("08801062633029"),
      productKeys.gradeReason("7"),
      searchKeys.result("두유"),
      savedKeys.list(),
    ];
    // 목표와 상관없는 조회
    const unrelated = [
      meKeys.user(),
      metaKeys.policies(),
      onboardingKeys.healthConsent(),
      onboardingKeys.samples(),
      searchKeys.suggestions("두유"),
      searchKeys.popularKeywords(),
    ];
    for (const key of [...dependents, ...unrelated])
      queryClient.setQueryData(key, {});

    await invalidateGoalDependents(queryClient);

    const isInvalidated = (key: readonly unknown[]) =>
      queryClient.getQueryState(key)?.isInvalidated;
    for (const key of dependents) expect(isInvalidated(key)).toBe(true);
    for (const key of unrelated) expect(isInvalidated(key)).toBe(false);
  });
});
